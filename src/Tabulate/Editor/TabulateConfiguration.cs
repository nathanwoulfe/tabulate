using Umbraco.Cms.Core.PropertyEditors;

namespace Tabulate.Editor;

public class TabulateConfiguration
{
    [ConfigurationField("wide", "Wide", "boolean", Description = "")]
    public bool Wide { get; set; }

    [ConfigurationField("canAccessSettings", "Can access settings", "textstring", Description = "Comma-separated list of group aliases to have access to Tabulate settings")]
    public string? CanAccessSettings { get; set; }

    [ConfigurationField("customView", "Custom view", "textstring", Description = "Path to a custom view for rendering add/edit dialogs")]
    public string? CustomView { get; set; }

    [ConfigurationField("customViewSize", "Custom view size", "textstring", Description = "Overlay size for edit and custom views ('small', 'medium', 'large')")]
    public string? CustomViewSize { get; set; }

    [ConfigurationField("mapsApiKey", "Google Maps API key", "textstring", Description = "API key for Google Maps in address dialog")]
    public string? MapsApiKey { get; set; }

    //[ConfigurationField("rte", "Rich text editor", "views/propertyeditors/rte/rte.prevalues.html", Description = "Rich text editor configuration")]
    //public string? RTE { get; set; }
}
