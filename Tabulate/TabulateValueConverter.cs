using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Web;
using Tabulate.Models;
using Umbraco.Core;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors;

namespace Tabulate
{
    public class TabulateValueConverter : IPropertyValueConverter
    {

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <returns></returns>
        public bool IsConverter(IPublishedPropertyType propertyType) => propertyType.EditorAlias.Equals("NW.Tabulate");
        

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <returns></returns>
        public Type GetPropertyValueType(IPublishedPropertyType propertyType) => typeof(TabulateModel);


        /// <summary>
        /// What is this and what does it do? Copied from https://github.com/umbraco/Umbraco-CMS/blob/91c52cffc8b7c70dc956f6c6610460be2d1adc51/src/Umbraco.Core/PropertyEditors/PropertyValueConverterBase.cs#L14
        /// </summary>
        /// <param name="value"></param>
        /// <param name="level"></param>
        /// <returns></returns>
        public bool? IsValue(object value, PropertyValueLevel level)
        {
            switch (level)
            {
                case PropertyValueLevel.Source:
                    return value != null && (!(value is string) || string.IsNullOrWhiteSpace((string)value) == false);
                default:
                    throw new NotSupportedException($"Invalid level: {level}.");
            }
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="owner"></param>
        /// <param name="propertyType"></param>
        /// <param name="source"></param>
        /// <param name="preview"></param>
        /// <returns></returns>
        public object ConvertSourceToIntermediate(IPublishedElement owner, IPublishedPropertyType propertyType, object source, bool preview)
        {
            Attempt<object> attemptConvert = source.TryConvertTo<object>();
            return attemptConvert.Success ? attemptConvert.Result : null;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="owner"></param>
        /// <param name="propertyType"></param>
        /// <param name="referenceCacheLevel"></param>
        /// <param name="inter"></param>
        /// <param name="preview"></param>
        /// <returns></returns>
        public object ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType,
            PropertyCacheLevel referenceCacheLevel, object inter, bool preview)
        {
            JObject data = JObject.Parse(inter.ToString());

            var model = new TabulateModel
            {
                Headers = (from JObject col in data["settings"]["columns"] select new HeaderModel(col)).ToList(),
                Settings = new SettingsModel(data["settings"]),
                Rows = (from JObject d in data["data"] select new RowModel(d)).ToList()
            };

            if (!model.Rows.Any()) return model;

            JToken rowData = data["data"];
            var index = 0;

            foreach (RowModel row in model.Rows)
            {
                foreach (HeaderModel header in model.Headers)
                {
                    JToken cellValue = rowData[index]?[header.Name];

                    if (cellValue == null)
                        continue;

                    switch (header.Type)
                    {
                        case "date":
                            row.Cells.Add(cellValue.ToObject<DateTime>());
                            break;
                        case "number":
                            row.Cells.Add(cellValue.ToObject<int>());
                            break;
                        case "rte":
                            //row.Cells.Add(RichText(cellValue.ToObject<string>()));
                            row.Cells.Add(new HtmlString(cellValue.ToObject<string>()));
                            break;
                        default:
                            row.Cells.Add(cellValue.ToObject<string>());
                            break;
                    }
                }

                // need this to lookup the raw jtoken value
                index += 1;
            }

            return model;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="owner"></param>
        /// <param name="propertyType"></param>
        /// <param name="referenceCacheLevel"></param>
        /// <param name="source"></param>
        /// <param name="preview"></param>
        /// <returns></returns>
        public object ConvertIntermediateToXPath(IPublishedElement owner, IPublishedPropertyType propertyType,
            PropertyCacheLevel referenceCacheLevel, object source, bool preview) => source?.ToString() ?? string.Empty;


        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <returns></returns>
        public PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Elements;

    }
}