using System.Collections.Generic;
using Umbraco.Core;
using Umbraco.Core.Composing;
using Umbraco.Web.JavaScript;

namespace Tabulate
{
    [RuntimeLevel(MinLevel = RuntimeLevel.Run)]
    public class TabulateComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            composition.Components()
                .Append<TabulateComponent>();
        }
    }

    public class TabulateComponent : IComponent
    {
        public TabulateComponent()
        {
            ServerVariablesParser.Parsing += ServerVariablesParser_Parsing;
        }

        public void Initialize()
        {
        }

        public void Terminate()
        {
        }

        private void ServerVariablesParser_Parsing(object sender, IDictionary<string, object> e)
        {
            Dictionary<string, object> umbracoSettings = e["umbracoSettings"] as Dictionary<string, object> ?? new Dictionary<string, object>();
            e.Add("Tabulate", new Dictionary<string, object>
            {
                { "pluginPath", $"{umbracoSettings["appPluginsPath"]}/tabulate/backoffice" }                
            });
        }
    }
}