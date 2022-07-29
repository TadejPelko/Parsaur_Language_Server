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
		}
		return item;
	}
}