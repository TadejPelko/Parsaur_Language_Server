import { DocumentFormattingParams, TextEdit } from 'vscode-languageserver';


// TO BE IMPLEMENTED
export function getDocumentFormattingHandler() {
	return (params: DocumentFormattingParams): Promise<TextEdit[]> => {
		const { textDocument } = params;
		const res: TextEdit[] = [];

		return Promise.resolve(res);
	};
}