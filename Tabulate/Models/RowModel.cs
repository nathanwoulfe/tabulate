using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Tabulate.Models
{

    /// <summary>
    /// 
    /// </summary>
    public class RowModel
    {
        public List<object> Cells { get; set; }

        public string Label { get; }

        public int? Id { get; }

        public bool? Disabled { get; }

        public float? Lat { get; }
        public float? Lng { get; }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="row"></param>
        public RowModel(JObject row)
        {
            Cells = new List<object>();

            Label = row["_label"]?.ToObject<string>();

            Id = row["_id"]?.ToObject<int>();

            Disabled = row["disabled"]?.ToObject<bool>() ?? false;

            Lat = row["lat"]?.ToObject<float>();
            Lng = row["lng"]?.ToObject<float>();
        }
    }
}