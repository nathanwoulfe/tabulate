using Newtonsoft.Json.Linq;

namespace Tabulate.Models;

public class SettingsModel
{
    public SettingsModel(JToken? settings = null)
    {
        if (settings is null)
        {
            return;
        }

        LabelFormat = settings.SelectToken("label")?.ToObject<string>();
        ItemsPerPage = settings.SelectToken("numPerPage")?.ToObject<int>();
        OrderBy = settings.SelectToken("sortOrder")?.ToObject<string>();
    }

    public string? LabelFormat { get; set; }

    /// <summary>
    /// A, D or M for Ascending, Descending or Manual, respectively
    /// TODO => make this an enum
    /// </summary>
    public string? OrderBy { get; set; }

    public int? ItemsPerPage { get; set; }

}
