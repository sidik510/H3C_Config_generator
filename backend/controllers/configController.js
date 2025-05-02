const templateModel = require('../models/templateModel');

// Fungsi replace variabel dalam template
function replaceVariables(template, values) {
  let config = template;
  for (const key in values) {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    config = config.replace(regex, values[key]);
  }
  return config;
}

// Controller untuk generate konfigurasi
const generateConfig = (req, res) => {
  const { device_type, config_name, variables } = req.body;

  if (!device_type || !config_name || !variables) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  templateModel.getTemplateByTypeAndName(device_type, config_name, (err, template) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const finalConfig = replaceVariables(template.template_text, variables);
    res.json({ config: finalConfig });
  });
};

module.exports = {
  generateConfig
};
