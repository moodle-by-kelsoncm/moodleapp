// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { NgModule, Type, provideAppInitializer } from '@angular/core';
import { CoreStyles } from './services/styles';
import { CorePromiseUtils } from '@static/promise-utils';
import { CoreLogger } from '@static/logger';

/**
 * Maximum time to wait for styles to be preloaded during app boot before giving up and letting the app continue.
 * This initializer preloads the styles of every stored site (see CoreStylesService.initialize), which can
 * involve fetching remote data; if any of those calls hangs (e.g. an unreachable custom CSS URL), it must not
 * block the whole app from bootstrapping forever, since this runs as an APP_INITIALIZER.
 */
const STYLES_INITIALIZATION_TIMEOUT = 10000;

/**
 * Get style services.
 *
 * @returns Returns style services.
 */
export async function getStyleServices(): Promise<Type<unknown>[]> {
    const { CoreStylesService } = await import('@features/styles/services/styles');

    return [
        CoreStylesService,
    ];
}

@NgModule({
    providers: [
        provideAppInitializer(async () => {
            try {
                await CorePromiseUtils.timeoutPromise(CoreStyles.initialize(), STYLES_INITIALIZATION_TIMEOUT);
            } catch (error) {
                CoreLogger.getInstance('CoreStylesModule').error(
                    'Styles took too long to initialize, continuing without waiting for them',
                    error,
                );
            }
        }),
    ],
})
export class CoreStylesModule {}
