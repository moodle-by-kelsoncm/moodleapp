# Setup do emulador Android para testar o moodleapp localmente

Notas de configuração feitas em 2026-09-09 para testar a conexão do app com
`https://academico.ava.ifrn.edu.br` sem cair no bloqueio de CORS do modo
browser (`npm start` / `ionic serve`).

Máquina: Linux, worktree em
`/home/kelson/projetos/PESSOAL/mbkw/moodleapp/.claude/worktrees/<nome>`
(mas o setup do SDK/Gradle abaixo é global à máquina, vale para qualquer
worktree do projeto).

## Por que o modo browser dá erro `serverconnectionajax`

Rodando `npm start`, o app usa `HttpClient` do Angular (uma página web comum),
sujeito a CORS do navegador. Requisições cross-origin para
`academico.ava.ifrn.edu.br` são bloqueadas pelo navegador (`status: 0`,
"Unknown error"), mesmo que o site funcione normalmente numa aba aberta
direto. Rodando nativo (Cordova/emulador), o app usa o plugin HTTP nativo, que
não passa por CORS.

## 1. Instalar Android SDK (command-line tools)

Sem Android Studio, só as ferramentas de linha de comando:

```bash
mkdir -p ~/Android/Sdk/cmdline-tools
cd /tmp
curl -L -o cmdline-tools.zip \
  "https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip"
unzip cmdline-tools.zip -d extracted
mv extracted/cmdline-tools ~/Android/Sdk/cmdline-tools/latest
```

> O número da versão (`10406996`) muda com o tempo. Para achar o atual, veja
> `https://dl.google.com/android/repository/repository2-3.xml` e procure por
> `commandlinetools-linux-*_latest.zip` dentro de um `<remotePackage path="cmdline-tools;...">`
> com `channelRef ref="channel-0"` (canal estável).

Variáveis de ambiente (adicionadas ao `~/.zshrc`):

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Aceitar licenças e instalar pacotes base:

```bash
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "emulator" \
  "system-images;android-34;google_apis;x86_64" "build-tools;34.0.0"
```

Mais tarde também foi necessário (ver seção sobre erro de build-tools/SDK 37):

```bash
sdkmanager "build-tools;36.0.0" "platforms;android-37.2"
```

## 2. Criar e rodar o emulador

```bash
avdmanager create avd -n moodle_test \
  -k "system-images;android-34;google_apis;x86_64" -d pixel_5 --force

emulator -avd moodle_test -no-snapshot -no-boot-anim &

adb wait-for-device
# aguardar: adb shell getprop sys.boot_completed  ->  1
```

Requer `/dev/kvm` acessível pelo usuário (grupo `kvm`) para aceleração de
hardware — sem isso o emulador é extremamente lento.

## 3. Instalar o Gradle (separado do Android SDK!)

O `cordova-android` precisa de um `gradle` no PATH para **gerar** o wrapper do
projeto na primeira vez (`gradlew`). Sem isso dá o erro:

```
Could not find an installed version of Gradle either in Android Studio,
or on your system to install the gradle wrapper.
```

```bash
curl -L -o gradle.zip "https://services.gradle.org/distributions/gradle-9.7.1-bin.zip"
mkdir -p ~/gradle
unzip gradle.zip -d ~/gradle
mv ~/gradle/gradle-9.7.1 ~/gradle/latest
```

No `~/.zshrc`:

```bash
export PATH="$HOME/gradle/latest/bin:$PATH"
```

Qualquer versão razoavelmente recente do Gradle serve aqui — ele só é usado
uma vez para gerar o `gradlew` do projeto (que depois baixa a versão que o
projeto realmente pede, ex. Gradle 8.14.2, dentro de `~/.gradle/wrapper/`).

### Download do Gradle do wrapper muito lento?

Se `services.gradle.org` estiver lento para o download automático do
`gradlew`, baixe manualmente e coloque no cache antes de rodar o build:

```bash
curl -L -o gradle-8.14.2-bin.zip "https://services.gradle.org/distributions/gradle-8.14.2-bin.zip"
# conferir sha256 em https://services.gradle.org/distributions/gradle-8.14.2-bin.zip.sha256
mkdir -p ~/.gradle/wrapper/dists/gradle-8.14.2-bin/<hash-da-pasta>
cp gradle-8.14.2-bin.zip ~/.gradle/wrapper/dists/gradle-8.14.2-bin/<hash-da-pasta>/
```

(O `<hash-da-pasta>` aparece no próprio erro/log do Gradle Wrapper quando ele
tenta baixar, ou em `~/.gradle/wrapper/dists/gradle-8.14.2-bin/`.)

## 4. IMPORTANTE: rodar tudo dentro do worktree/checkout que será usado

**Cuidado com worktrees aninhados dentro do repo principal** (ex.:
`.claude/worktrees/<nome>` dentro do próprio `moodleapp/`). O Cordova
(`cordova-lib`'s `isCordova()`) sobe a árvore de diretórios procurando uma
pasta com `www/` + `config.xml` — se o worktree ainda não tiver `www/`
(build) nem `node_modules/`, ele acaba tratando o **repositório principal**
como raiz do projeto e mexe nos arquivos versionados (`package.json`,
`package-lock.json`) de lá por engano.

Solução: antes de rodar qualquer comando `cordova`, garanta que o diretório
onde você está tem seus próprios `node_modules/`, `www/` e `platforms/`
(mesmo que `platforms/` comece vazio):

```bash
npm install
npm run build           # gera www/
mkdir -p platforms       # garante que o Cordova pare de subir a árvore
npx cordova platform add android
```

Sempre rode `git status --porcelain` antes/depois em ambos os checkouts
(worktree e principal) para garantir que nada foi alterado no lugar errado.

## 4.5. Gerar o `gradlew` manualmente, se `cordova build` não fizer isso sozinho

Na primeira vez que testei (worktree 1), o `gradlew` foi gerado como efeito
colateral do primeiro `npx cordova build android`. Testando de novo do zero
num segundo worktree, isso **nem sempre acontece sozinho** (ex.: se você
gerar o wrapper manualmente antes do primeiro build completo). Se
`platforms/android/gradlew` não existir, **não rode `gradle wrapper` direto
na raiz de `platforms/android`** — vai quebrar assim:

```
Could not compile script '.../CordovaLib/cordova.gradle'
unable to resolve class XmlParser
```

Isso acontece porque `cordova.gradle` usa a classe Groovy `XmlParser`,
incompatível com Gradle 9.x, e a raiz do projeto sempre carrega esse script
(mesmo só para gerar o wrapper).

A solução é gerar o wrapper dentro de `platforms/android/tools/`, que tem seu
**próprio miniprojeto Gradle isolado** (só um `settings.gradle`, sem o
`cordova.gradle` problemático), e depois copiar os arquivos gerados para a
raiz da plataforma — exatamente como o `cordova-android` faz internamente
(`lib/builders/ProjectBuilder.js`):

```bash
cd platforms/android/tools
gradle wrapper
cd ../../..

cp platforms/android/tools/gradlew platforms/android/gradlew
cp platforms/android/tools/gradlew.bat platforms/android/gradlew.bat
cp -r platforms/android/tools/gradle platforms/android/gradle
```

Isso gera um wrapper apontando para a versão do `gradle` do sistema (ex.:
9.7.1), que pode não ser a que o projeto realmente quer (o AGP configurado no
`build.gradle` pode não suportar Gradle 9.x). Force a versão conhecida boa
(8.14.2) editando `gradle-wrapper.properties` em **ambos** os lugares
(`platforms/android/gradle/wrapper/` e
`platforms/android/tools/gradle/wrapper/`):

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.2-bin.zip
```

(Se já tiver essa versão baixada de uma build anterior, fica em
`~/.gradle/wrapper/dists/gradle-8.14.2-bin/`, então não baixa de novo.)

## 5. Build falha pedindo SDK 37 (ainda não estável)

O `config.xml` do projeto pede `compileSdkVersion`/`targetSdkVersion` 37, que
em set/2026 só existe como builds trimestrais de preview
(`platforms;android-37.0`, `37.1`, `37.2`), não como pacote final
`android-37`. O erro:

```
Failed to find target with hash string 'android-37' in: <SDK path>
```

Correção **sem editar `config.xml`** (arquivo do projeto): sobrescrever via
propriedades do Gradle na hora do build, usando SDK 36 (bem suportado):

```bash
./platforms/android/gradlew -p platforms/android cdvBuildDebug \
  -PcdvCompileSdkVersion=36 -PcdvSdkVersion=36 -PcdvBuildToolsVersion=36.0.0
```

Essas propriedades (`cdvCompileSdkVersion`, `cdvSdkVersion`,
`cdvBuildToolsVersion`, `cdvMinSdkVersion`, `cdvMaxSdkVersion`) são lidas em
`platforms/android/CordovaLib/cordova.gradle`.

## 6. App trava na splash screen (cordova.js não carrega)

Se o app abrir e ficar preso na tela de splash (logo do Moodle) para sempre,
mesmo com o JS "vivo" por baixo (dá pra confirmar via
`adb shell cat /proc/net/unix | grep devtools`, achar o socket
`webview_devtools_remote_<pid>`, dar `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`
e checar `http://localhost:9222/json` + `Runtime.evaluate` via
DevTools Protocol) — o sintoma é `window.cordova === undefined`.

Causa: usar `npm run build` (build "puro" do Angular) + `cordova build
android` manualmente **pula** o builder oficial `@ionic/cordova-builders`, que
é quem injeta `<script src="cordova.js"></script>` no `index.html` final.
Sem isso, `deviceready` nunca dispara e o app espera pra sempre.

Correção rápida (editando o artefato de build `www/index.html`, não o
`src/index.html` do projeto):

```html
<body>
    <script src="cordova.js"></script>
    <app-root></app-root>
    ...
```

Depois:

```bash
npx cordova prepare android   # recopia www/ -> platforms/android/.../assets/www
# rebuild (gradle, ver seção 5 para os overrides de SDK)
```

**Solução melhor a explorar no futuro**: usar o pipeline oficial
`ionic cordova build android` (builder `@ionic/cordova-builders:cordova-build`
configurado em `angular.json`, alvo `ionic-cordova-build`) em vez de
`npm run build` + `cordova build android` manual — ele já injeta o
`cordova.js` sozinho. Não cheguei a testar se ele também precisa dos overrides
de SDK 36 da seção 5.

## 7. Instalar e abrir no emulador

```bash
adb install -r platforms/android/app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p com.moodle.moodlemobile -c android.intent.category.LAUNCHER 1
```

## 8. Debugar o WebView (HTML/CSS/JS)

Via Chrome desktop:

1. `chrome://inspect/#devices`
2. Marcar "Discover USB devices" (funciona com emulador via adb também)
3. Achar `com.moodle.moodlemobile` em Remote Target → "inspect"

Ou via linha de comando (sem abrir Chrome), usando o Chrome DevTools
Protocol diretamente:

```bash
adb shell cat /proc/net/unix | grep devtools   # acha webview_devtools_remote_<pid>
adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>
curl -s http://localhost:9222/json             # lista páginas debugáveis + webSocketDebuggerUrl
```

A partir daí dá pra conectar via WebSocket (Node 22+ tem `WebSocket` global
nativo) e mandar comandos do protocolo (`Runtime.evaluate`,
`Runtime.enable` + escutar `Runtime.consoleAPICalled` /
`Runtime.exceptionThrown`, `Page.reload`, etc.) sem precisar de UI gráfica.

## Resultado

Com tudo isso, o app conectou normalmente em
`https://academico.ava.ifrn.edu.br`, chegando na tela de login (incluindo
botão de login via SUAP) — confirmando que o problema original era
exclusivamente CORS do modo browser, não um bug de rede real.
