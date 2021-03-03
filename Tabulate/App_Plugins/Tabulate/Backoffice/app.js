import { ControllersModule } from './controllers/_controllersModule';
import { ResourcesModule } from './resources/_resourcesModule';

const name = 'tabulate';

angular.module(name, [
    ControllersModule,
    ResourcesModule
]);

angular.module('umbraco').requires.push(name);