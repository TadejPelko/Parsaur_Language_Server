import { DocumentFormattingParams, TextEdit } from 'vscode-languageserver';

export function getDocumentFormattingHandler(){
	return (params: DocumentFormattingParams): Promise<TextEdit[]> => {
		const { textDocument } = params;
    	//const doc = documents.get(textDocument.uri)!;
    	//const text = doc.getText();
		let res : TextEdit[] = [];

		return Promise.resolve(res);
	}
}