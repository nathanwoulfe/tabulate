using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Tabulate.Models
{
    public class RowModel
    {
        public List<object> Cells { get; set; }

        public string Label { get; set; }

        public int? Id { get; set; }

        public bool? Disabled { get; set; }

        public float? Lat { get; set; }
        public float? Lng { get; set; }

        public RowModel(JObject row)
        {
            Cells = new List<object>();
            Label = row["_label"]?.ToObject<string>();
            Id = row["_id"]?.ToObject<int>();
            Disabled = row["disabled"]?.ToObject<bool>();
            Lat = row["lat"]?.ToObject<float>();
            Lng = row["lng"]?.ToObject<float>();
        }
    }
}