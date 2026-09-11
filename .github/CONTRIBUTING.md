# Contributing to Moodle App

[Moodle][1] is made by people like you. We are members of a big worldwide community of developers, designers, teachers, testers, translators and many more. We work in universities, schools, companies and other places. You are very welcome to join us and contribute to the project.

There are many ways that you can contribute to Moodle App, not just through development. See our [development guide][2] for some of the many ways that you can help.

## Github

All issues should be reported via, and patched provided to the [Moodle Tracker][3].

You have to create a fork of the Moodle App [Github repository][4] and there you should create branches with the Moodle Tracker issue id (MOBILE-XXXX).

> [!IMPORTANT]
> Please do not publish security issues, or patches releating to them publicly.
> See our [Responsible Disclosure Policy][5] for more information.


## Moodle App plugins

Moodle has a framework for additional plugins to extend its functionality. We
have a Moodle plugins directory <https://moodle.org/plugins/> where you can
register and maintain your plugin. Plugins hosted in the plugins directory can
be easily installed and updated via the Moodle administration interface, but you have to take care to make plugins compatible with the Moodle App. To help with this we have a [guideline][6] to develop plugins compabible with the Moodle App.

* You are expected to have a public source code repository with your plugin
  code.
* After registering your plugin in the plugins directory it is reviewed before
  being published.
* You are expected to continuously release updated versions of the plugin via
  the plugins directory. We do not pull from your code repository; you must do
  it explicitly.

For further details, see <https://moodledev.io/general/community/plugincontribution>.

## Fluxo deste fork (moodle-by-kelsoncm)

As seções acima descrevem o processo do projeto upstream. Este fork usa um
fluxo próprio, mais simples, para o dia a dia:

- Toda tarefa começa com uma issue no GitHub deste repositório (não no Moodle
  Tracker).
- O nome da branch usa o número da issue como sufixo:
  `issues/<numero-da-issue>[-descricao-curta]`.
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)
  com uma tag adicional entre colchetes (`[ADD]`, `[FIX]`, `[UPD]`, `[DEL]`,
  `[UPG]`), em português.

### Time tracking

O tempo é controlado pelo [GitHub Project "Moodle App -
Desenvolvimento"](https://github.com/orgs/moodle-by-kelsoncm/projects/1),
vinculado a este repositório, com dois campos numéricos (em horas):

| Campo | Quando preencher |
|---|---|
| **Estimativa (h)** | Ao criar a issue, com uma estimativa do esforço esperado. |
| **Tempo gasto (h)** | Ao fechar a issue, com o tempo realmente gasto. |

Passo a passo:

1. Crie a issue (`gh issue create ...`).
2. Adicione-a ao Project e preencha **Estimativa (h)**:
   ```bash
   gh project item-add 1 --owner moodle-by-kelsoncm --url <url-da-issue>
   gh project item-edit --project-id PVT_kwDOETCYP84BjM3M \
     --id <item-id> --field-id PVTF_lADOETCYP84BjM3MzhiCJ1k --number <horas>
   ```
3. Ao concluir e fechar a issue, preencha **Tempo gasto (h)** da mesma forma,
   usando o field-id `PVTF_lADOETCYP84BjM3MzhiCHYs`.

Se a issue não teve uma estimativa formal antes de começar, deixe
**Estimativa (h)** em branco em vez de preencher um número retroativo — isso
manteria o histórico impreciso.

[1]: https://moodle.org
[2]: https://moodledev.io/general/app/development/development-guide
[3]: https://moodle.atlassian.net
[4]: https://github.com/moodlehq/moodleapp
[5]: https://moodledev.io/general/development/process/security
[6]: https://moodledev.io/general/app/development/plugins-development-guide
