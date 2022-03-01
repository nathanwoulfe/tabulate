using System.Collections.Generic;

namespace Tabulate.Umbraco.ValueConverters.Models
{
    public class TabulateModel
    {
        public SettingsModel Settings { get; set; }
        public List<HeaderModel> Headers { get; set; }
        public List<RowModel> Rows { get; set; }
    }
}