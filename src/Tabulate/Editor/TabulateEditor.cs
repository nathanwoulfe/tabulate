using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;

namespace Tabulate.Editor;

[DataEditor(
        alias: "NW.Tabulate",
        name: "Tabulate",
        view: "/App_Plugins/Tabulate/Backoffice/views/tabulate.html",
        type: EditorType.PropertyValue,
        ValueType = ValueTypes.Json,
        Group = "lists",
        Icon = "icon-grid")]
public class TabulateEditor : DataEditor
{
    private readonly IIOHelper _ioHelper;
    private readonly IEditorConfigurationParser _editorConfigurationParser;

    public TabulateEditor(
        IDataValueEditorFactory factory,
        IIOHelper ioHelper,
        IEditorConfigurationParser editorConfigurationParser,
        EditorType type = EditorType.PropertyValue)
        : base(factory, type)
    {
        _ioHelper = ioHelper;
        _editorConfigurationParser = editorConfigurationParser;
    }

    protected override IConfigurationEditor CreateConfigurationEditor()
        => new TabulateConfigurationEditor(_ioHelper, _editorConfigurationParser);
}
