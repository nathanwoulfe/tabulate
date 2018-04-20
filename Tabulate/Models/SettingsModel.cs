using Newtonsoft.Json.Linq;

namespace Tabulate.Models
{
    public class SettingsModel
    {
        public string LabelFormat { get; set; }
        public int ItemsPerPage { get; set; }

        public SettingsModel(JToken settings)
        {
            LabelFormat = settings["label"].ToObject<string>();
            ItemsPerPage = settings["numPerPage"].ToObject<int>();
        }
    }
}