using Newtonsoft.Json.Linq;

namespace Tabulate.Models;

public class HeaderModel
{
    public HeaderModel(JObject header)
    {
        Name = header["displayName"]?.ToObject<string>();
        Type = header["type"]?.ToObject<string>();
    }

    public string? Name { get; set; }
    public string? Type { get; set; }
}
