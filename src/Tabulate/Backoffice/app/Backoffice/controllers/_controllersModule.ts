import { TabulateController } from './tabulate.controller';
import { TabulateDialogController } from './tabulate.dialog.controller';
import { TabulateMapDialogController } from './tabulate.mapdialog.controller';
import { TabulateSettingsController } from './tabulate.settings.controller';

export const ControllersModule = angular
  .module('tabulate.controllers', [])
  .controller(TabulateController.controllerName, TabulateController)
  .controller(TabulateDialogController.controllerName, TabulateDialogController)
  .controller(TabulateMapDialogController.controllerName, TabulateMapDialogController)
  .controller(TabulateSettingsController.controllerName, TabulateSettingsController)
  .name;
