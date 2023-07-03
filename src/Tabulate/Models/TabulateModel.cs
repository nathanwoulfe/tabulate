using Microsoft.CodeAnalysis;
using Newtonsoft.Json.Linq;

namespace Tabulate.Models;

public class TabulateModel
{
    public TabulateModel(JObject? data = null)
    {
        if (data is null)
        {
            return;
        }

        Settings = new(data.SelectToken("settings"));

        JToken? columns = data.SelectToken("settings.columns");
        if (columns is not null)
        {
            Headers = (from JObject col in columns.Children() select new HeaderModel(col)).ToList();
        }

        JToken? rows = data.SelectToken("data");
        if (rows is not null)
        {
            Rows = (from JObject row in rows.Children() select new RowModel(row)).ToList();
        }
    }

    public SettingsModel Settings { get; set; } = new();
    public List<HeaderModel> Headers { get; set; } = new();
    public List<RowModel> Rows { get; set; } = new();
}
