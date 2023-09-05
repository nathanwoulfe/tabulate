export class TabulateMapDialogController {

    static name = "Tabulate.MapDialog.Controller";

    constructor($scope) {
        const position = { lat: $scope.model.lat ?? -25.363, lng: $scope.model.lng ?? 131.044 };

        const map = new google.maps.Map(document.getElementById('map'),
            {
                zoom: 14,
                center: position,
            });

        const marker = new google.maps.Marker({
            map,
            position,
            draggable: true
        });

        google.maps.event.addListener(marker, 'dragend', e => {
            $scope.model.lat = e.latLng.lat();
            $scope.model.lng = e.latLng.lng();
        });
    }
}