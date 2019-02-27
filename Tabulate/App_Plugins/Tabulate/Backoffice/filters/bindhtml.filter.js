(() => {

    function filter($sce) {
        return input => {
            return $sce.trustAsHtml(input);
        };
    }

    angular.module('tabulate.filters').filter('bindHtml', ['$sce', filter]);
})();