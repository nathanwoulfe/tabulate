/*global angular */
(function () {
    'use strict';

    function stopEvent() {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                element.bind('click', function (e) {
                    e.stopPropagation();
                });
            }
        };
    };

    angular.module("umbraco.directives").directive('stopEvent', stopEvent);

})();
