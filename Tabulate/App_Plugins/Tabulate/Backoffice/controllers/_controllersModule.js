import { TabulateController } from './tabulate.controller';
import { TabulateDialogController } from './tabulate.dialog.controller';
import { TabulateMapDialogController } from './tabulate.mapdialog.controller';
import { TabulateSettingsController } from './tabulate.settings.controller';

export const ControllersModule = angular
    .module('tabulate.controllers', [])
    .controller(TabulateController.name, TabulateController)
    .controller(TabulateDialogController.name, TabulateDialogController)
    .controller(TabulateMapDialogController.name, TabulateMapDialogController)
    .controller(TabulateSettingsController.name, TabulateSettingsController)
    .name;