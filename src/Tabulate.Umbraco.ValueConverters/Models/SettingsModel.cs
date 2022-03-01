using Newtonsoft.Json.Linq;

namespace Tabulate.Umbraco.ValueConverters.Models
{
    public class SettingsModel
    {
        public string LabelFormat { get; set; }

        /// <summary>
        /// A, D or M for Ascending, Descending or Manual, respectively
        /// </summary>
        public string OrderBy { get; set; }

        public int ItemsPerPage { get; set; }

        public SettingsModel(JToken settings)
        {
            LabelFormat = settings["label"].ToObject<string>();
            ItemsPerPage = settings["numPerPage"].ToObject<int>();
            OrderBy = settings["sortOrder"].ToObject<string>();
        }
    }
}