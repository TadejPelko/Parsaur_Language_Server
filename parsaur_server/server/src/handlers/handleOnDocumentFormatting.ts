import { DocumentFormattingParams, TextEdit } from 'vscode-languageserver';

export function getDocumentFormattingHandler() {
	return (params: DocumentFormattingParams): Promise<TextEdit[]> => {
		const { textDocument } = params;
		const res: TextEdit[] = [];

		return Promise.resolve(res);
	};
}