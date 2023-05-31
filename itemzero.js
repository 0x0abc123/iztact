const ITEM0_ID = "_item0"
const itemzero = {
	"id":  ITEM0_ID,
	"item_type": "checkpoint",
	"autoCreateEndChoices": [],
	"title": "Item Zero Title",
	"detail": "This is the initial item loaded into the app, and its data is defined in `item0.js`. This is the place to provide an introduction to the purpose of the questionnaire and some background information. It will fetch the file `root.json`. The root JSON file contains the top-level items for the questionnaire.\n\nThe questionnaire data structure is made up of a tree of question items. Each item can have child items, and the children will be displayed if their parent item is selected. There are 3 types of items:\n\n- exclusive\n\n- checkable\n\n- checkpoint\n\n### Exclusive\nStandard HTML Radio button. When it is selected, its sibling items are unselected. You can also toggle it to an unselected state by clicking on the radio button.\n### Checkable\nStandard HTML Checkbox. Multiple checkable sibling items can be selected, or none of the checkable siblings can be selected.\n### Checkpoint\nMandatory questionnaire item.",
	"help" : "Placeholder for additional help or links related to the item. This field supports *Markdown* and is rendered by [marked.js](https://github.com/markedjs/marked)",
	"childSelectionRequired": true,
	"children_json":  "root.json",
	"sort_order": 1,
	"childItems": [],
	"childCheckpoints": [],
	"user_input": "",
	"parentID": "", 
	"selected": false, 
	"hasCheckpointDescendants": false 
}

export { ITEM0_ID, itemzero }