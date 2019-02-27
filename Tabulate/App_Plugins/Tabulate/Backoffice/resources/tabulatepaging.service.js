(() => {

    function tabulatePagingService() {

        /**
         * 
         * @param {any} total
         * @param {any} perPage
         */
        const countPages = (total, perPage) => Math.ceil(parseInt(total, 10) / parseInt(perPage, 10));
        
        /**
         * 
         * @param {any} items
         * @param {any} filter
         * @param {any} pageNumber
         * @param {any} numPerPage
         */
        const updatePaging = (items, filter, pageNumber, numPerPage) => {

            let begin = (pageNumber - 1) * numPerPage,
                end = begin + numPerPage,
                paged = items;

            // if a filter value exists, filter the items before paging
            if (filter !== undefined) {
                paged = getFilteredPage(items, filter);
            }

            const totalPages = Math.ceil(paged.length / numPerPage);

            if (pageNumber > totalPages) {
                begin = 0;
                end = begin + totalPages;
                pageNumber = 1;
            }

            return { items: paged.slice(begin, end), totalPages: totalPages, pageNumber: pageNumber, search: filter };
        };

        /**
         * 
         * @param {any} items
         * @param {any} term
         */
        const getFilteredPage = (items, term) => {

            const paged = [];
            const l = items.length;

            let i, // loop index
                j, // inner loop index
                o, // the object plucked from items array
                keys,
                pushed;

            for (i = 0; i < l; i += 1) {
                o = items[i];
                pushed = false;

                if (typeof o === 'object') {
                    keys = Object.keys(o);
                    for (j = 0; j < keys.length; j++) {
                        if (!pushed &&
                            o[keys[j]] !== undefined &&
                            o[keys[j]] !== null &&
                            o[keys[j]].toString().toLowerCase().indexOf(term.toString().toLowerCase()) !== -1) {
                            paged.push(o);
                            pushed = true;
                        }
                    }
                } else {
                    if (o && o.toLowerCase().indexOf(term.toLowerCase()) !== -1) {
                        paged.push(o);
                    }
                }
            }
            return paged;
        };

        /**
         * 
         * @param {any} i
         * @param {any} j
         */
        const setCurrentPage = (i, j) => j === undefined ?
            (i - 1 > 0 ? i - 1 : i) :
            (i + 1 <= j ? i + 1 : i);
        
        return {
            countPages: countPages,
            updatePaging: updatePaging,
            getFilteredPage: getFilteredPage,
            setCurrentPage: setCurrentPage
        };
    }

    angular.module('tabulate.services').factory('tabulatePagingService', tabulatePagingService);
})();