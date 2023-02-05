using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Html;
using Newtonsoft.Json.Linq;
using Tabulate.Models;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Extensions;

namespace Tabulate.Editor;

public class TabulateValueConverter : IPropertyValueConverter
{

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
    public bool? IsValue(object? value, PropertyValueLevel level)
    {
        switch (level)
        {
            case PropertyValueLevel.Source:
                return value is not null && (value is not string || string.IsNullOrWhiteSpace((string)value) == false);
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
    public object ConvertIntermediateToObject(
        IPublishedElement owner,
        IPublishedPropertyType propertyType,
        PropertyCacheLevel referenceCacheLevel,
        object? inter,
        bool preview)
    {
        if (inter is null || inter.ToString() is null)
        {
            return new TabulateModel();
        }

        var data = JObject.Parse(inter.ToString()!);

        TabulateModel model = new(data);

        if (model.Rows is null || !model.Rows.Any())
        {
            return model;
        }

        JToken? rowData = data.SelectToken("data");
        if (rowData is null)
        {
            return model;
        }

        var index = 0;

        foreach (RowModel row in model.Rows)
        {
            foreach (HeaderModel header in model.Headers)
            {
                if (header.Name is null)
                {
                    continue;
                }

                JToken? cellValue = rowData[index]?[header.Name];

                if (cellValue is null)
                {
                    continue;
                }

                string? cellValueString = cellValue.ToObject<string>();

                if (cellValueString is null)
                {
                    continue;
                }

                switch (header.Type)
                {
                    case ColumnType.Date:
                        row.Cells.Add(cellValue.ToObject<DateTime>());
                        break;
                    case ColumnType.Number:
                        row.Cells.Add(cellValue.ToObject<int>());
                        break;
                    case ColumnType.RichText:
                        row.Cells.Add(new HtmlString(cellValueString));
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

            // need this to lookup the raw JToken value
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
    public object ConvertIntermediateToXPath(
        IPublishedElement owner,
        IPublishedPropertyType propertyType,
        PropertyCacheLevel referenceCacheLevel,
        object? source,
        bool preview) => source?.ToString() ?? string.Empty;


    /// <summary>
    /// 
    /// </summary>
    /// <param name="propertyType"></param>
    /// <returns></returns>
    public PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Elements;
}
