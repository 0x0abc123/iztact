import { createApp, ref, reactive } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
//import { createApp, ref, reactive } from './vue.esm-browser.prod.js'
import { itemzero, ITEM0_ID } from './itemzero.js'
import { marked } from './marked.esm.js'

const item0 = itemzero

function sortItems(itemA, itemB) {
	return itemA.sort_order - itemB.sort_order
}

function getChildrenJsonURL(item) {
	return 'data/'+item.children_json
}

var autochoices = null
async function loadAutoChoices(){
	return fetch(getChildrenJsonURL({children_json: 'autocreate.json'}))
		.then(response => { if(!response.ok) { throw new Error(response.status); }; return response.json(); })
		.then(rdata => autochoices = rdata)
		.catch(err => {console.log(err)});
}

// Global State reactive object
const GS = reactive({
	checkpointNavList : [item0],
	currentCheckpoint : 0,	
	mapItemIDsToItems : {}
})
GS.mapItemIDsToItems[ITEM0_ID] = item0

function addToCheckpointNavList(checkpoint) {
	GS.checkpointNavList.push(checkpoint)
}
function resetCheckpointNavList() {
	while (GS.checkpointNavList.length > 0)
		GS.checkpointNavList.pop()
}

function debug(msg) {console.log(msg)}

var app = createApp({

	setup() {

		const displayedItem = reactive({v:{}})

		function setDisplayedItem(item) {
			displayedItem.v = item
		}

		function goToCheckpoint(checkpointItem) {
			setDisplayedItem(checkpointItem)
		}	

		function recursivelyFindUnansweredItem(underItem) {
			debug(`item: ${underItem.id}, CSR: ${underItem.childSelectionRequired}`)
			if(underItem.childSelectionRequired) {
				if(underItem.childItems && underItem.childItems.length > 0) {
					for(let i=0; i < underItem.childItems.length; i++) {
						let ci = underItem.childItems[i]
						if(ci.selected) {
							let recursiveResult = recursivelyFindUnansweredItem(ci)
							if(recursiveResult)
								return recursiveResult
							else
								return null
						}
					}
					return underItem
				}
			}
			return null
		}
		
		function showCheckpointNavError(errorType, itemData){
			let msg = ''
			switch(errorType) {
				case 'unanswered':
					msg = `The following item requires at least one selection: ${itemData.title}`; break;
				default:
					msg = `unknown error: ${itemData.title}`
			}
			alert(msg)
		}

		function removeUnselectedItems(item) {
			for(let i = 0; i < item.childItems.length; i++) {
				let ci = item.childItems[i]
				if(!ci.selected)
					item.childItems[i] = {}
				else
					removeUnselectedItems(ci)
			}
			for(let i = 0; i < item.childCheckpoints.length; i++) {
				let ci = item.childCheckpoints[i]
				removeUnselectedItems(ci)
			}
		}
		
		function handleFinished() {
			let clonedItem0 = JSON.parse(JSON.stringify(item0))
			removeUnselectedItems(clonedItem0)
			console.log('finished...')
			console.log(JSON.stringify(clonedItem0))
		}	

		function isTerminalState() {return (displayedItem.v.terminalstate)}

		function canNavigatePrevCheckpoint() {return (GS.currentCheckpoint > 0)}
		function canNavigateFwdCheckpoint() {return (GS.currentCheckpoint < GS.checkpointNavList.length-1)}
		function navigatePrevCheckpoint() { if (canNavigatePrevCheckpoint){GS.currentCheckpoint--; goToCheckpoint(GS.checkpointNavList[GS.currentCheckpoint])}}
		function navigateFwdCheckpoint() {
			if (canNavigateFwdCheckpoint) {
				let unansweredItem = recursivelyFindUnansweredItem(GS.checkpointNavList[GS.currentCheckpoint])
				debug(`unanswereditem: ${unansweredItem}`)
				if(unansweredItem){
					showCheckpointNavError('unanswered',unansweredItem)
					return
				}
				GS.currentCheckpoint++; 
				goToCheckpoint(GS.checkpointNavList[GS.currentCheckpoint])
			}
		}
		//TODO: handle cases where currentCheckpoint becomes invalid due to recreated checkpointnavlist 


		return {
			displayedItem,
			setDisplayedItem,
			goToCheckpoint,
			canNavigateFwdCheckpoint,
			canNavigatePrevCheckpoint,
			navigateFwdCheckpoint,
			navigatePrevCheckpoint,
			recursivelyFindUnansweredItem,
			showCheckpointNavError,
			removeUnselectedItems,
			handleFinished,
			isTerminalState
		}
	},

	mounted() {
		this.goToCheckpoint(GS.checkpointNavList[0])
	}
})


app.component('itemdisplay',{
	props: {item:Object},
	beforeUpdate() {
		debug('beforeupdate')
		this.fetchChildren(this.item)
	},
	methods: {
		setVisibilityOfItemAndSiblings(clickedItem) {
			let clickedItemWasSelected = clickedItem.selected
			let shouldRecreateCheckpointNavList = false
			let itemParent = GS.mapItemIDsToItems[clickedItem.parentID]
			let clickedItemIsExclusive = clickedItem.item_type == "exclusive"
			itemParent.childItems.forEach(ci => {
				if(ci.id == clickedItem.id) {
					if(ci.hasCheckpointDescendants)
						shouldRecreateCheckpointNavList = true
					return
				}
				if(clickedItemWasSelected) {
					if(clickedItemIsExclusive) {
						ci.selected = false
						if(ci.item_type == "checkable")
							ci.disabled = true
						if (ci.hasCheckpointDescendants)
							shouldRecreateCheckpointNavList = true
					}
				}
				else { //clicked item was unselected
					if(clickedItemIsExclusive && ci.item_type == "checkable")
							ci.disabled = false
					else if(ci.hasCheckpointDescendants) //checkable item with checkpoint descendants
						shouldRecreateCheckpointNavList = true
				}
			})
			if (shouldRecreateCheckpointNavList)
				this.recursivelyRecreateCheckpointNavList(item0)
		},


		onItemSelected(item) {
			item.selected = !item.selected
			this.setVisibilityOfItemAndSiblings(item)
		},

		onHelpShow(item) {
			item.help_show = true
		},
		onHelpClose(item) {
			item.help_show = false
		},

		recursivelyRecreateCheckpointNavList(item) {
			if(item.id == ITEM0_ID) {
				resetCheckpointNavList()
				addToCheckpointNavList(item0)
			}
			if(item.childItems)
				item.childItems.forEach(child => {
					if (child.selected)
						this.recursivelyRecreateCheckpointNavList(child)
				})
			if(item.childCheckpoints)
				item.childCheckpoints.forEach(child => {
					addToCheckpointNavList(child)
					this.recursivelyRecreateCheckpointNavList(child)
				})
		},

		propogateCheckpointDescendantFlagUpward(item){
			item.hasCheckpointDescendants = true
			let parent = GS.mapItemIDsToItems[item.parentID]
			if (parent && parent.id)
				this.propogateCheckpointDescendantFlagUpward(parent)
		},


		async createEndChoices(item, choicesList){
			if (!autochoices) await loadAutoChoices()
			choicesList.forEach( (element) => {
				let tmpE = autochoices[element];
				let newE = {
					"id":  item.id+'_'+tmpE.id,
					"item_type": tmpE.item_type,
					"autoCreateEndChoices": [],
					"title": tmpE.title,
					"detail": tmpE.detail,
					"help" : marked.parse(tmpE.help),
					"childSelectionRequired": false,
					"children_json":  "",
					"sort_order": tmpE.sort_order,
					"childItems": [],
					"childCheckpoints": [],
					"user_input": "optional",
					"user_input_show": true,
					"help_show": false,
					"parentID": item.id, 
					"selected": false, 
					"hasCheckpointDescendants": false 			
				}
				item.childItems.push(newE)
				GS.mapItemIDsToItems[newE.id] = newE
			});
			item.childItems.sort(sortItems)
		},

		fetchChildren(item) {
			debug('fetch children for '+item.id)
			if (!item.childItems) item.childItems = []
			if (!item.childCheckpoints) item.childCheckpoints = []
			
			if(item.autoCreateEndChoices && item.autoCreateEndChoices.length > 0 && item.childItems.length == 0){
				this.createEndChoices(item, item.autoCreateEndChoices)
				return
			}
			let hasEmptyChildrenLists = (item.childItems.length == 0 && item.childCheckpoints.length == 0)
			if(item.children_json && hasEmptyChildrenLists) {	
				debug('fetch url '+item.children_json)
				fetch(getChildrenJsonURL(item)).then(response => { if(!response.ok) { throw new Error(response.status); }; return response.json(); })
				.then(childrenobjs => {
					let checkpointsAdded = false
					childrenobjs.forEach(child => {
						GS.mapItemIDsToItems[child.id] = child
						child.detail = marked.parse(child.detail)
						child.user_input_show = (child.user_input && child.user_input != "")
						child.help_show = false
						if(child.help) child.help = marked.parse(child.help)
						child.parentID = item.id
						if (child.item_type == "exclusive" || child.item_type == "checkable") {
							child.selected = false
							item.childItems.push(child)
						}
						else {
							item.childCheckpoints.push(child)
							checkpointsAdded = true
						}
					})
					item.childItems.sort(sortItems)
					item.childCheckpoints.sort(sortItems)
					if (checkpointsAdded) {
						this.propogateCheckpointDescendantFlagUpward(item)
						this.recursivelyRecreateCheckpointNavList(item0)
					}
					debug('item fetched children')
					debug(item)
				})
			}
			else if(!hasEmptyChildrenLists && item.hasCheckpointDescendants) {
				this.recursivelyRecreateCheckpointNavList(item0)
			}
		}


	},
	template: '#t_itemdisplay'
})

app.mount('#app')


window.exposeGS = GS
/*
{
	"id":  "unique ID",
	"item_type": "checkpoint|checkable|exclusive",
	"terminalstate": true|false, // <-- set a checkpoint to be the final screen where user can submit questionnaire
	"autoCreateEndChoices": ["existing","requirement","assistance"], //<- can be empty array
	"title": "short title of item",
	"detail": "detailed information",
	"help" : "additional help or links related to the item",
	"childSelectionRequired": true|false, //<-if there are children, require that at least one be selected
	"children_json":  "child_json_filename.json", // json file will be fetched dynamically as required, path relative to webroot
	"sort_order": "how this will be sorted against its siblings"
	[added at runtime]"childItems": [], // checkable|exclusive items ids populated at runtime when json is fetched
	[added at runtime]"childCheckpoints": [],// child checkponit ids populated at runtime when json is fetched
	[added at runtime]"user_input": ,
	[added at runtime]"user_input_show": true|false // show user input textarea if question needs it
	[added at runtime]"help_show": true|false // if help content exists, toggle modal dialog to display it
	[added at runtime]"parentID": "the id of its parent item" 
	[added at runtime]"selected": true|false 
	[added at runtime]"hasCheckpointDescendants": true|false 
}

checkpoint
	checkable
		exclusive
		exclusive
	exclusive
		checkpoint
			exclusive
			exclusive
				checkable
					exclusive
					exclusive
				checkable
					checkable
						exclusive
						exclusive
							checkpoint
								exclusive
								exclusive
					checkable
						checkpoint
							exclusive
							exclusive
					checkable
						checkable
						checkable
						checkpoint
							exclusive
							exclusive
						exclusive
				checkable
					exclusive
					exclusive
			checkpoint
				checkable
					exclusive
					exclusive
				checkable
					exclusive
					exclusive
			checkpoint
				checkable
					exclusive
					exclusive
				checkable
					exclusive
					exclusive
		checkable
			exclusive
			exclusive
		checkable
			exclusive
			exclusive

*/

