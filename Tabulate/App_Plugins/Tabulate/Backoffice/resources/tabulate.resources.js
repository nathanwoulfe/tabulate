/*global angular, google, confirm */
(function () {
    'use strict';
    function tabulateResource(notificationsService, assetsService, $q, authResource, editorState) {

        return {

            // another helper - goes the opposite way, converting JSON back to CSV for exporting
            JSONtoCSV: (json, header) => {

                const arr = typeof json !== 'object' ? JSON.parse(json) : json;
                const headerKeys = [];

                var csv = '',
                    row,
                    i,
                    j,
                    o;

                //This condition will generate the Label/Header
                if (header) {
                    row = '';

                    // iterate config as header, taking unique display names
                    for (i = 0; i < header.length; i += 1) {
                        const name = header[i].displayName;
                        if (headerKeys.indexOf(name) === -1) {
                            headerKeys.push(name);
                            row += name + ',';
                        }
                    }
                    // trim trailing comma
                    row = row.slice(0, -1);
                    //append Label row with line break
                    csv += row + '\r\n';
                }

                //1st loop is to extract each row
                for (i = 0; i < arr.length; i += 1) {
                    row = '';
                    o = arr[i];

                    for (j = 0; j < headerKeys.length; j += 1) {
                        const headerKey = o[headerKeys[j]];
                        if (headerKey !== undefined) {
                            const data = typeof headerKey === 'string' ? headerKey : JSON.stringify(headerKey);
                            row += `"${data.replace(/"/gi, '""')}",`;
                        } else {
                            row += '"",';
                        }
                    }

                    // trim trailling comma
                    row = row.slice(0, -1);
                    //add a line break after each row
                    csv += row + '\r\n';
                }
                return csv;
            },

            // helper function to convert CSV string into an array
            CSVtoArray: (strData, strDelimiter) => {

                strDelimiter = (strDelimiter || ',');

                const objPattern = new RegExp((`(\\${strDelimiter}|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^"\\${strDelimiter}\\r\\n]*))`), 'gi');
                const arrData = [[]];

                var arrMatches,
                    strMatchedDelimiter,
                    strMatchedValue;

                while (arrMatches = objPattern.exec(strData)) {
                    strMatchedDelimiter = arrMatches[1];
                    if (strMatchedDelimiter.length && (strMatchedDelimiter !== strDelimiter)) {
                        // Since we have reached a new row of data,
                        // add an empty row to our data array.
                        arrData.push([]);
                    }
                    if (arrMatches[2]) {
                        strMatchedValue = arrMatches[2].replace(
                        new RegExp('""', 'g'), '"');
                    } else {
                        strMatchedValue = arrMatches[3];
                    }
                    arrData[arrData.length - 1].push(strMatchedValue);
                }

                return (arrData);
            },

            loadGoogleMaps: () => {
                var deffered = $q.defer();
                if (window.google === undefined) {
                    assetsService.loadJs('//www.google.com/jsapi')
                        .then(() => {
                            loadMapsApi();
                        });
                } else {
                    loadMapsApi();
                }

                function loadMapsApi() {
                    if (window.google.maps === undefined) {
                        window.google.load('maps', '3', {
                            callback: () => {
                                deffered.resolve(true);
                            }
                        });
                    }
                    else if (window.google.maps !== undefined) {
                        deffered.resolve(true);
                    }
                }

                return deffered.promise;
            },

            // geocodes a single address string
            geocode: (d) => {

                if (window.google.maps !== undefined) {

                    const keys = Object.keys(d);
                    const geocoder = new google.maps.Geocoder();

                    let p = '';

                    if (keys.indexOf('Address') !== -1) {
                        p = 'Address';
                    }

                    if (p !== '' && confirm('Found location data - geocode it?')) {
                        var geoStr = `_${p}`;
                        const address = d[p];

                        geocoder.geocode({ 'address': address }, (results, status) => {

                            if (status === google.maps.GeocoderStatus.OK) {
                                d[geoStr] = results[0].geometry.location;
                                d.lat = results[0].geometry.location.lat();
                                d.lng = results[0].geometry.location.lng();
                                notificationsService.success('Success', 'Geocode successful');
                            } else {
                                d[geoStr] = undefined;
                                notificationsService.error('Error', `Geocode failed: ${status}`);
                            }
                        });
                    }
                }

                return d;
            },

            setLabels: (items, force, format) => {

                if (items) {
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            parseLabel(item);
                        });
                    }
                    else {
                        parseLabel(items);
                    }
                }

                return items;

                // construct the label for the item/s, based on the pattern defined in settings
                // labels can refer to object properties - defined by parent|child in the label
                function parseLabel(o) {
                    if (force || o._label === undefined) {
                        const pattern = /{(.*?)}/g;

                        let m;
                        let label = '';

                        do {
                            m = pattern.exec(format);

                            if (m) {

                                const labelKeys = m[1].split('|');
                                const replacementText = labelKeys.length === 1 ? o[labelKeys[0]] : o[labelKeys[0]][labelKeys[1]];
                                
                                label = label.length ? label.replace(m[0], replacementText) : format.replace(m[0], replacementText);
                            }
                        } while (m);

                        o._label = label;
                    }
                }
            },

            // modifies a mapped tabulate editor - either update content or toggle enabled/disabled state
            updateMappedEditor: (resp, v, mappings) => {

                var setLabels = this.setLabels,
                    getMappingScope = this.getMappingScope;

                mappings.forEach(m => {

                    var mappingElement = getMappingScope(m.targetEditor.alias),
                        i = 0;

                    if (mappingElement) {

                        var key = m.sourceProperty.displayName;
                        var mappingKey = m.targetProperty.displayName;

                        // loop handles editor or state - based on presence of resp or v
                        mappingElement.value.data.forEach(mapping => {
                            if (resp !== undefined && resp.remap === mapping[mappingKey]) {
                                mapping[mappingKey] = resp.data[key];
                                mapping = setLabels(mapping, true, mappingElement.value.settings.label);
                                i++;
                            } else if (v !== undefined && v[key] === mapping[mappingKey]) {
                                mapping.disabled = v.disabled;
                                i++;
                            }
                        });

                        if (i > 0) {
                            const str = resp === undefined ? (v.disabled ? 'deactivated' : 'activated') : 'updated';
                            notificationsService.warning(i + ' row' + (i > 1 ? 's' : '') + ' in ' + m.targetEditor.label + (i > 1 ? ' have' : ' has') + ' been ' + str);
                        }
                    }
                });
            },

            // finding mapping element scope using the existing scope
            // need this for updating other editors when relationships are defined
            getMappingScope: alias => {
                var found = false,
                    resp;

                editorState.current.tabs.forEach(v => {
                    if (!found) {
                        v.properties.forEach(vv => {
                            if (vv.alias === alias) {
                                resp = vv;
                                found = true;
                            }
                        });
                    }
                });

                return resp;
            }
        };
    }

    angular.module('umbraco.resources').factory('tabulateResource', ['notificationsService', 'assetsService', '$q', 'authResource', 'editorState', tabulateResource]);
})();