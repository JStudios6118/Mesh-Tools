[Table of Contents](/docs/table-of-contents.md)

# Global Settings

Global settings are settings that will apply to everything. Global settings are modified with the follow method:

```js
const MeshTools = require('mesh-tools');

MeshTools.Configure(setting_name, value);
// Setting Name: The name of the setting you would like to change
// Value: The value you would like to set for that property
```

Here is a list of the global settings that can be changed.

### `print_logs` - (type: bool) Sets whether or not logs will be printed

### `min_log_level` - (type: integer [1-5]) Sets the minimum level a log must be to be printed to the console.

### `max_log_level` - (type: integer [1-5]) Sets the maximum level a log must be to be printed to the console.

---

[Table of Contents](/docs/table-of-contents.md)