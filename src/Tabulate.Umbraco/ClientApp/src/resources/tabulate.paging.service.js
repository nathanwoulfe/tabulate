export class TabulatePagingService {

    static name = 'tabulatePagingService';

    constructor() {

    }

    /**
     * 
     * @param {any} total
     * @param {any} perPage
     */
    countPages = (total, perPage) => Math.ceil(parseInt(total, 10) / parseInt(perPage, 10))

    /**
     * 
     * @param {any} items
     * @param {any} filter
     * @param {any} pageNumber
     * @param {any} numPerPage
     */
    updatePaging = (items, filter, pageNumber, numPerPage) => {

        let begin = (pageNumber - 1) * numPerPage,
            end = begin + numPerPage,
            paged = items;

        // if a filter value exists, filter the items before paging
        if (filter) {
            paged = this.getFilteredPage(items, filter);
        }

        const totalPages = Math.ceil(paged.length / numPerPage);

        if (pageNumber > totalPages) {
            begin = 0;
            end = begin + totalPages;
            pageNumber = 1;
        }

        return {
            items: paged.slice(begin, end),
            totalPages,
            pageNumber,
            search: filter
        };
    }

    /**
     * 
     * @param {any} items
     * @param {any} term
     */
    getFilteredPage = (items, term) => {

        const paged = [];
        const l = items.length;

        term = term.toString().toLowerCase();

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
                    if (!pushed && o[keys[j]] && o[keys[j]].toString().toLowerCase().includes(term)) {
                        paged.push(o);
                        pushed = true;
                    }
                }
            } else {
                if (o && o.toLowerCase().includes(term)) {
                    paged.push(o);
                }
            }
        }
        return paged;
    }

    /**
     * 
     * @param {any} i
     * @param {any} j
     */
    setCurrentPage = (i, j) => j === undefined ?
        (i - 1 > 0 ? i - 1 : i) :
        (i + 1 <= j ? i + 1 : i)

}