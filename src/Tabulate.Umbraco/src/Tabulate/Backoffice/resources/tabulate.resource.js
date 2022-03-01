export class TabulateResource {

    static name = 'tabulateResource';

    constructor(notificationsService, assetsService, $q, editorState) {
        this.notificationsService = notificationsService;
        this.assetsService = assetsService;
        this.$q = $q;
        this.editorState = editorState;
    }

    fieldTypes = () =>
        [
            { label: 'Text string', value: 'string' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Rich text', value: 'rte' },
            { label: 'Number', value: 'number' },
            { label: 'Email', value: 'email' },
            { label: 'Telephone', value: 'tel' },
            { label: 'Date', value: 'date' },
            { label: 'Url', value: 'url' },
            { label: 'Color', value: 'color' },
            { label: 'Linked', value: 'linked' },
        ]

    // another helper - goes the opposite way, converting JSON back to CSV for exporting
    JSONtoCSV = (json, header) => {

        const arr = typeof json !== 'object' ? JSON.parse(json) : json;
        const headerKeys = [];

        let csv = '',
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
    }

    // helper function to convert CSV string into an array
    CSVtoArray = (strData, strDelimiter) => {

        strDelimiter = (strDelimiter || ',');

        const objPattern = new RegExp((`(\\${strDelimiter}|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^"\\${strDelimiter}\\r\\n]*))`), 'gi');
        const arrData = [[]];

        let arrMatches,
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
    }

    loadGoogleMaps = apiKey => {

        const deferred = this.$q.defer();

        if (!apiKey) {
            return deferred.resolve(false);
        }

        const loadMapsApi = () => {
            if (!window.google.maps) {
                window.google.load('maps', '3', {
                    other_params: `key=${apiKey}`,
                    callback: () => deferred.resolve(true)
                });
            } else if (window.google.maps) {
                deferred.resolve(true);
            }
        };

        if (!window.google) {
            this.assetsService.loadJs('https://www.google.com/jsapi')
                .then(() => loadMapsApi());
        } else {
            loadMapsApi();
        }

        return deferred.promise;
    }

    // geocodes a single address string
    geocode = d => {

        if (!window.google.maps)
            return d;

        const keys = Object.keys(d);
        const p = keys.indexOf('Address') !== -1 ? 'Address' : '';

        if (p !== '' && confirm('Found location data - geocode it?')) {

            const geoStr = `_${p}`;
            const geocoder = new google.maps.Geocoder();
            const address = d[p];

            geocoder.geocode({ 'address': address }, (results, status) => {

                if (status === google.maps.GeocoderStatus.OK) {
                    d[geoStr] = results[0].geometry.location;
                    d.lat = results[0].geometry.location.lat();
                    d.lng = results[0].geometry.location.lng();
                    this.notificationsService.success('Success', 'Geocode successful');
                } else {
                    d[geoStr] = undefined;
                    this.notificationsService.error('Error', `Geocode failed: ${status}`);
                }
            });
        }        

        return d;
    }

    setLabels = (items, force, format) => {

        if (!items)
            return;

        if (Array.isArray(items)) {
            items.forEach(item => parseLabel(item));            
        }
        else {
            parseLabel(items);
        }        

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

                        let replacementText = '';
                        if (labelKeys[0]) {
                            replacementText = labelKeys.length === 1 ? o.data[labelKeys[0]] : o.data[labelKeys[0]][labelKeys[1]];
                        }

                        label = label.length ? label.replace(m[0], replacementText) : format.replace(m[0], replacementText);
                    }
                } while (m);

                o._label = label;
            }
        }
    }

    /**
    */
    getTabulateEditors = (currentAlias, variant) => {
        // stores refs to other editors for mapping
        const tabulateEditors = [];

        /* set values for the mappings - can map to any other tabulate instance on the node */
        variant.tabs.forEach(v => {
            v.properties.forEach(vv => {
                if (currentAlias !== vv.alias && vv.editor === 'NW.Tabulate') {
                    tabulateEditors.push(vv);
                }
            });
        });

        return tabulateEditors;
    }

    /*
     * Updates a linked editor by finding all records where the value matches
     * the previous value on the source object 
     */
    updateMappedEditor = (source, previous, mappings, alias, variant) => {
        if (!mappings || !mappings.length)
            return;

        const tabulateEditors = this.getTabulateEditors(alias, variant);

        mappings.forEach(m => {
            let mappingElement = tabulateEditors.find(x => x.alias === m.targetEditor.alias);
            if (!mappingElement)
                return;

            let updatedCount = 0;

            let fromKey = m.sourceProperty.displayName;
            let toKey = m.targetProperty.displayName;

            // if the mapped field is also defined as a linked property, use the toKey_label field
            // since linked fields store the label
            if (mappingElement.value.data[0].hasOwnProperty(toKey + '_link')) {
                fromKey = '_label';
            }

            const rowsToUpdate = mappingElement.value.data.filter(d => d[toKey] === previous[fromKey]);
            rowsToUpdate.forEach(row => {
                row[toKey] = source[fromKey];
                row.disabled = !!source.disabled;

                this.setLabels(row, true, mappingElement.value.settings.label);

                updatedCount += 1;
            });

            if (updatedCount === 0)
                return;

            this.notificationsService.warning(`${updatedCount} linked row${(updatedCount > 1 ? 's' : '')} modified in ${m.targetEditor.label}`);
        });
    }
}
