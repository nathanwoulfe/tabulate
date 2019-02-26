using System;

namespace Tabulate.Models
{
    public class CellModel
    {
        public object Value { get; set; }
        public string Type { get; }

        public CellModel(string type)
        {
            Type = type;
        }
    }
}
