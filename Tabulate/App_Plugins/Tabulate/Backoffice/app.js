(() => {

    angular.module('tabulate.directives', []);
    angular.module('tabulate.resources', []);
    angular.module('tabulate.services', []);
    angular.module('tabulate.components', []);

    angular.module('tabulate', [
        'tabulate.directives', 
        'tabulate.services', 
        'tabulate.components',
        'tabulate.resources',
    ]);

    angular.module('umbraco').requires.push('tabulate');

})();