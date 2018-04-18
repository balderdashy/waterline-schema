//  ██╗   ██╗ █████╗ ██╗     ██╗██████╗
//  ██║   ██║██╔══██╗██║     ██║██╔══██╗
//  ██║   ██║███████║██║     ██║██║  ██║
//  ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║
//   ╚████╔╝ ██║  ██║███████╗██║██████╔╝
//    ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝
//
//  ██████╗ ██████╗  ██████╗ ██████╗ ███████╗██████╗ ████████╗██╗███████╗███████╗
//  ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║██╔════╝██╔════╝
//  ██████╔╝██████╔╝██║   ██║██████╔╝█████╗  ██████╔╝   ██║   ██║█████╗  ███████╗
//  ██╔═══╝ ██╔══██╗██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗   ██║   ██║██╔══╝  ╚════██║
//  ██║     ██║  ██║╚██████╔╝██║     ███████╗██║  ██║   ██║   ██║███████╗███████║
//  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚══════╝╚══════╝
//
module.exports = [
  // Basic semantics:
  'type',
  'defaultsTo',
  'required',
  'allowNull',
  'autoUpdatedAt',
  'autoCreatedAt',

  // Auto-migrations:
  'autoMigrations',

  // High-level validation rules:
  'validations',

  // Associations:
  'through',
  'collection',
  'model',
  'via',
  'dominant',

  // Adapter:
  'columnName',
  'meta',

  // At-rest encryption:
  'encrypt',

  // Advisory
  'description',
  'extendedDescription',
  'moreInfoUrl',
  'example',
  'protect',

  // Request for Helm generator capabilities, for great, quick prototypes.  See commit log for explanation
  'label',
  'hideFromTable',
  'hideFromForm',
  'notEditable',
  'toolTip',
  'filterable',
  'beforeFormRender',  // fn
  'beforeIndexRender', // fn
];
