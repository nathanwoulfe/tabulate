(() => {

    function filter($sce) {
        return input => $sce.trustAsHtml(input);        
    }

    angular.module('tabulate.filters').filter('bindHtml', ['$sce', filter]);
})();