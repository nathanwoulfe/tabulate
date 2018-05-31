using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using Tabulate.Models;
using Umbraco.Core;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors;
using Umbraco.Web;
using Umbraco.Web.Templates;

namespace Tabulate
{
    public class TabulateValueConverter : IPropertyValueConverterMeta
    {
        /// <summary>
        /// Parse links in rich text field
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        private static string RichText(string value)
        {
            if (UmbracoContext.Current == null || UmbracoContext.Current.RoutingContext == null)
            {
                return value;
            }

            return TemplateUtilities.ParseInternalLinks(value, UmbracoContext.Current.UrlProvider);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <returns></returns>
        public bool IsConverter(PublishedPropertyType propertyType)
        {
            return propertyType.PropertyEditorAlias.Equals("NW.Tabulate");
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <param name="source"></param>
        /// <param name="preview"></param>
        /// <returns></returns>
        public object ConvertDataToSource(PublishedPropertyType propertyType, object source, bool preview)
        {
            Attempt<object> attemptConvert = source.TryConvertTo<object>();

            return attemptConvert.Success ? attemptConvert.Result : null;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <param name="source"></param>
        /// <param name="preview"></param>
        /// <returns></returns>
        public object ConvertSourceToObject(PublishedPropertyType propertyType, object source, bool preview)
        {
            JObject data = JObject.Parse(source.ToString());

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
                    JToken value = rowData[index];
                    if (value == null) continue;

                    switch (header.Type)
                    {
                        case "date":
                            row.Cells.Add(value[header.Name]?.ToObject<DateTime>());
                            break;
                        case "number":
                            row.Cells.Add(value[header.Name]?.ToObject<int>());
                            break;
                        case "rte":
                            row.Cells.Add(RichText(value[header.Name]?.ToObject<string>()));
                            break;
                        default:
                            row.Cells.Add(value[header.Name]?.ToObject<string>());
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
        /// <param name="propertyType"></param>
        /// <param name="source"></param>
        /// <param name="preview"></param>
        /// <returns></returns>
        public object ConvertSourceToXPath(PublishedPropertyType propertyType, object source, bool preview)
        {
            return source.ToString();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <returns></returns>
        public Type GetPropertyValueType(PublishedPropertyType propertyType)
        {
            return typeof(TabulateModel);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="propertyType"></param>
        /// <param name="cacheValue"></param>
        /// <returns></returns>
        public PropertyCacheLevel GetPropertyCacheLevel(PublishedPropertyType propertyType, PropertyCacheValue cacheValue)
        {
            PropertyCacheLevel returnLevel;
            switch (cacheValue)
            {
                case PropertyCacheValue.Object:
                    returnLevel = PropertyCacheLevel.ContentCache;
                    break;
                case PropertyCacheValue.Source:
                    returnLevel = PropertyCacheLevel.Content;
                    break;
                case PropertyCacheValue.XPath:
                    returnLevel = PropertyCacheLevel.Content;
                    break;
                default:
                    returnLevel = PropertyCacheLevel.None;
                    break;
            }

            return returnLevel;
        }
    }
}