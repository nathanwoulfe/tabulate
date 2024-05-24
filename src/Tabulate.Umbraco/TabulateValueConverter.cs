using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Html;
using Newtonsoft.Json.Linq;
using Tabulate.Umbraco.ValueConverters.Models;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Templates;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace Tabulate.Umbraco.ValueConverters;

public class TabulateValueConverter : IPropertyValueConverter
{
    private readonly IUmbracoContextAccessor _umbracoContextAccessor;
    private readonly IPublishedUrlProvider _publishedUrlProvider;

    public TabulateValueConverter(IUmbracoContextAccessor umbracoContextAccessor, IPublishedUrlProvider publishedUrlProvider)
    {
        _umbracoContextAccessor = umbracoContextAccessor;
        _publishedUrlProvider = publishedUrlProvider;
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="propertyType"></param>
    /// <returns></returns>
    public bool IsConverter(IPublishedPropertyType propertyType) => propertyType.EditorAlias.Equals(Constants.Alias);

    /// <summary>
    /// 
    /// </summary>
    /// <param name="propertyType"></param>
    /// <returns></returns>
    public Type GetPropertyValueType(IPublishedPropertyType propertyType) => typeof(TabulateModel);

    /// <summary>
    /// 
    /// </summary>
    /// <param name="value"></param>
    /// <param name="level"></param>
    /// <returns></returns>
    public bool? IsValue(object? value, PropertyValueLevel level) => level switch
    {
        PropertyValueLevel.Source => value is not null && (value is not string || string.IsNullOrWhiteSpace((string)value) is false),
        _ => throw new NotSupportedException($"Invalid level: {level}."),
    };

    /// <summary>
    /// 
    /// </summary>
    /// <param name="owner"></param>
    /// <param name="propertyType"></param>
    /// <param name="source"></param>
    /// <param name="preview"></param>
    /// <returns></returns>
    public object? ConvertSourceToIntermediate(IPublishedElement owner, IPublishedPropertyType propertyType, object? source, bool preview)
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
    public object ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType, PropertyCacheLevel referenceCacheLevel, object? inter, bool preview)
    {
        if (inter is null || inter.ToString() is not string interString)
        {
            return new TabulateModel();
        }

        var data = JObject.Parse(interString);

        if (data is null || data["data"] is null || data["settings"]?["columns"] is null)
        {
            return new TabulateModel();
        }

        TabulateModel model = new()
        {
            Headers = (from JObject col in data["settings"]!["columns"]! select new HeaderModel(col)).ToList(),
            Settings = new SettingsModel(data["settings"]!),
            Rows = (from JObject d in data["data"]! select new RowModel(d)).ToList(),
        };

        if (model.Rows.Count == 0)
        {
            return model;
        }

        JToken rowData = data["data"]!;
        var index = 0;

        foreach (RowModel row in model.Rows)
        {
            foreach (HeaderModel header in model.Headers)
            {
                JToken? cellValue = rowData[index]?[header.Name];

                if (cellValue is null)
                {
                    continue;
                }

                string? cellValueString = cellValue.ToObject<string>();

                switch (header.Type)
                {
                    case ColumnType.Date:
                        row.Cells.Add(cellValue.ToObject<DateTime>());
                        break;
                    case ColumnType.Number:
                        row.Cells.Add(cellValue.ToObject<int>());
                        break;
                    case ColumnType.RichText:
                        HtmlLocalLinkParser parser = new(_umbracoContextAccessor, _publishedUrlProvider);
                        string? parsedString = string.IsNullOrEmpty(cellValueString) ? cellValueString : parser.EnsureInternalLinks(cellValueString, preview);
                        row.Cells.Add(new HtmlString(parsedString));
                        break;
                    case ColumnType.Url:
                        if (Uri.TryCreate(cellValueString, UriKind.RelativeOrAbsolute, out Uri? uri))
                        {
                            row.Cells.Add(uri);
                        }

                        break;
                    case ColumnType.Email:
                        if (new EmailAddressAttribute().IsValid(cellValueString))
                        {
                            row.Cells.Add(cellValueString);
                        }

                        break;
                    default:
                        row.Cells.Add(cellValueString);
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
    public object ConvertIntermediateToXPath(IPublishedElement owner, IPublishedPropertyType propertyType, PropertyCacheLevel referenceCacheLevel, object? source, bool preview)
        => source?.ToString() ?? string.Empty;

    /// <summary>
    /// 
    /// </summary>
    /// <param name="propertyType"></param>
    /// <returns></returns>
    public PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Elements;
}
