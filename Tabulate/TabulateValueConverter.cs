using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Tabulate.Models;
using Umbraco.Core;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors;
using Umbraco.Web.Composing;
using Umbraco.Web.Templates;

namespace Tabulate
{
    public class TabulateValueConverter : IPropertyValueConverter
    {

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <returns></returns>
        public bool IsConverter(PublishedPropertyType propertyType) => propertyType.EditorAlias.Equals("NW.Tabulate");
        

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <returns></returns>
        public Type GetPropertyValueType(PublishedPropertyType propertyType) => typeof(TabulateModel);


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
        public object ConvertSourceToIntermediate(IPublishedElement owner, PublishedPropertyType propertyType, object source, bool preview)
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
        public object ConvertIntermediateToObject(IPublishedElement owner, PublishedPropertyType propertyType,
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

                    var cellModel = new CellModel(header.Type);

                    switch (header.Type)
                    {
                        case "date":
                            cellModel.Value = cellValue.ToObject<DateTime>();
                            break;
                        case "number":
                            cellModel.Value = cellValue.ToObject<int>();
                            break;
                        case "rte":
                            cellModel.Value = RichText(cellValue.ToObject<string>());
                            break;
                        default:
                            cellModel.Value = cellValue.ToObject<string>();
                            break;
                    }

                    row.Cells.Add(cellModel);
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
        public object ConvertIntermediateToXPath(IPublishedElement owner, PublishedPropertyType propertyType,
            PropertyCacheLevel referenceCacheLevel, object source, bool preview) => source?.ToString() ?? string.Empty;


        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <returns></returns>
        public PropertyCacheLevel GetPropertyCacheLevel(PublishedPropertyType propertyType) => PropertyCacheLevel.None;

        /// <summary>
        /// Parse links in rich text field
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        private static IHtmlString RichText(string value) => 
            Current.UmbracoContext == null || Current.UmbracoContext.UrlProvider == null ? 
            default(IHtmlString) :
            new MvcHtmlString(TemplateUtilities.ParseInternalLinks(value, Current.UmbracoContext.UrlProvider));
        
    }
}