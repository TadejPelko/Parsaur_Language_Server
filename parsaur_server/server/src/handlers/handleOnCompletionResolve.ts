import {CompletionItem} from 'vscode-languageserver/node';

export function getCompletionResolveHandler(){
	return (item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'Constructor details';
			item.documentation = 'docs';
		} else if (item.data === 2) {
			item.detail = 'Character details';
			item.documentation = 'docs';
		} else if (item.data === 3) {
			item.detail = 'Base details';
			item.documentation = 'docs';
		} else if (item.data === 4) {
			item.detail = 'INT details';
			item.documentation = 'docs';
		} else if (item.data === 5) {
			item.detail = 'ADD details';
			item.documentation = 'docs';
		} else if (item.data === 6) {
			item.detail = 'CREATE details';
			item.documentation = 'docs';
		} else if (item.data === 7) {
			item.detail = 'IMPORT details';
			item.documentation = 'docs';
		} else if (item.data === 8) {
			item.detail = 'General details';
			item.documentation = 'docs';
		} else if (item.data === 9) {
			item.detail = 'Decorator details';
			item.documentation = 'docs';
		} else if (item.data === 10) {
			item.detail = 'DefaultItem details';
			item.documentation = 'docs';
		} else if (item.data === 11) {
			item.detail = 'CastItem details';
			item.documentation = 'docs';
		} else if (item.data === 12) {
			item.detail = 'ParallelDecorator details';
			item.documentation = 'docs';
		} else if (item.data === 13) {
			item.detail = 'Generator details';
			item.documentation = 'docs';
		} else if (item.data === 14) {
			item.detail = 'LIST details';
			item.documentation = 'docs';
		} else if (item.data === 15) {
			item.detail = 'None details';
			item.documentation = 'docs';
		} else if (item.data === 16) {
			item.detail = 'General details';
			item.documentation = 'docs';
		} else if (item.data === 17) {
			item.detail = 'GeneralStrict details';
			item.documentation = 'docs';
		} else if (item.data === 18) {
			item.detail = 'Reference details';
			item.documentation = 'docs';
		} else if (item.data === 19) {
			item.detail = 'BreakItem details';
			item.documentation = 'docs';
		} else if (item.data === 20) {
			item.detail = 'DecoratorItem details';
			item.documentation = 'docs';
		} else if (item.data === 21) {
			item.detail = 'Optional details';
			item.documentation = 'docs';
		} else if (item.data === 22) {
			item.detail = 'OptionalGroup details';
			item.documentation = 'docs';
		} else if (item.data === 23) {
			item.detail = 'Input details';
			item.documentation = 'docs';
		} else if (item.data === 24) {
			item.detail = 'Output details';
			item.documentation = 'docs';
		} else if (item.data === 25) {
			item.detail = 'BreakPersist details';
			item.documentation = 'docs';
		} else if (item.data === 26) {
			item.detail = 'StopItem details';
			item.documentation = 'docs';
		} else if (item.data === 27) {
			item.detail = 'ListDelimiter details';
			item.documentation = 'docs';
		} else if (item.data === 28) {
			item.detail = 'ListItem details';
			item.documentation = 'docs';
		} else if (item.data === 29) {
			item.detail = 'ContainItem details';
			item.documentation = 'docs';
		} else if (item.data === 30) {
			item.detail = 'Rule details';
			item.documentation = 'docs';
		} else if (item.data === 31) {
			item.detail = 'Condition details';
			item.documentation = 'docs';
		} else if (item.data === 32) {
			item.detail = 'Display details';
			item.documentation = 'docs';
		} else if (item.data === 33) {
			item.detail = 'Remove details';
			item.documentation = 'docs';
		} else if (item.data === 34) {
			item.detail = 'Inherit details';
			item.documentation = 'docs';
		}else if (item.data === 35) {
			item.detail = 'AS details';
			item.documentation = 'docs';
		}
		return item;
	}
}