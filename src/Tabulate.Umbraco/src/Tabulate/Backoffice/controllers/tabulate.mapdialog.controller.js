export class TabulateMapDialogController {

    static name = "Tabulate.MapDialog.Controller";

    constructor($scope) {
        const map = new google.maps.Map(document.getElementById('map'),
            {
                zoom: 14,
                center: new google.maps.LatLng($scope.model.lat, $scope.model.lng)
            });

        const marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng($scope.model.lat, $scope.model.lng),
            draggable: true
        });

        const dragend = e => {
            if ($scope.model.lat !== e.latLng.lat() || $scope.model.lng !== e.latLng.lng()) {
                $scope.model.lat = e.latLng.lat();
                $scope.model.lng = e.latLng.lng();
            }
        };

        google.maps.event.addListener(marker, 'dragend', event => {
            dragend(event);
        });
    }
}