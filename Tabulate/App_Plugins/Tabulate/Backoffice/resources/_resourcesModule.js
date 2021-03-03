import { TabulateResource } from './tabulate.resource';
import { TabulatePagingService } from './tabulate.paging.service';

export const ResourcesModule = angular
    .module('tabulate.resources', [])
    .service(TabulateResource.name, TabulateResource)
    .service(TabulatePagingService.name, TabulatePagingService)
    .name;