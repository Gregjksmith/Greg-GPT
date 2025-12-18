
const jsonVocabularyString = `
	{\"[UNK]\": 0, \"[START]\": 1, \"[CLS]\": 2, \"[SEP]\": 3, \"[MASK]\": 4, \"[NULL]\": 5, 
	\"a\": 6, \"b\": 7, \"c\": 8, \"d\": 9, \"e\": 10, \"f\": 11, \"g\": 12, \"h\": 13, \"i\": 14, 
	\"j\": 15, \"k\": 16, \"l\": 17, \"m\": 18, \"n\": 19, \"o\": 20, \"p\": 21, \"q\": 22, \"r\": 23, 
	\"s\": 24, \"t\": 25, \"u\": 26, \"v\": 27, \"w\": 28, \"x\": 29, \"y\": 30, \"z\": 31, \"##a\": 32, 
	\"##b\": 33, \"##c\": 34, \"##d\": 35, \"##e\": 36, \"##f\": 37, \"##g\": 38, \"##h\": 39, \"##i\": 40, 
	\"##j\": 41, \"##k\": 42, \"##l\": 43, \"##m\": 44, \"##n\": 45, \"##o\": 46, \"##p\": 47, \"##q\": 48, 
	\"##r\": 49, \"##s\": 50, \"##t\": 51, \"##u\": 52, \"##v\": 53, \"##w\": 54, \"##x\": 55, \"##y\": 56, 
	\"##z\": 57, \"!\": 58, \"##!\": 59, \"?\": 60, \"##?\": 61, \".\": 62, \"##.\": 63, \",\": 64, \"##,\": 65, 
	\";\": 66, \"##;\": 67}`;

const specialCharacters = {'\n':'[LINE_FEED]', '\0':'[NULL]'}
const punctuation = ['!', '?', '.', ',', ';']
const sentenceDelimiters = ['!', '?', '.']
const openingBrackets = ['(', '[', '<']
const closingBrackets = [')', ']', '>']
const quotationMarks = ["\'"]

const unknownCharacter = "[UNK]"
const startCharacter = "[START]"
const lineFeedCharacter = "[LINE_FEED]"
const endWordCharacter = "[W_END]"
const classificationCharacter = "[CLS]"
const separationCharacter = "[SEP]"
const maskCharacter = "[MASK]"
const nullCharacter = "[NULL]"

class Vocabulary
{
	_vocabularyMap;
	_inverseMap;
	
	constructor(vocabulary)
	{
		this._vocabularyMap = vocabulary;
		
		this._inverseMap = {};
		Object.keys(this._vocabularyMap).forEach(key => 
		{
			const index = this._vocabularyMap[key];
			this._inverseMap[index] = key;
		});
	}
}

async function createVocabulary()
{
	const response = await fetch('vocabulary.json');
	return await response.json();
	//const vocabulary = JSON.parse(jsonVocabularyString);
	//return new Vocabulary(vocabulary);
}

async function getVocabulary()
{
	//const response = await fetch('vocabulary.json');
	//return await response.json();
	return JSON.parse(jsonVocabularyString);
}

function tokenizerEncode(vocabulary, inputText)
{
	function _splitAndNormalize(t)
	{
		return Array.from(inputText.matchAll(/[\w']+|[-.,!?;\n\(\)\[\]\"]/gi).map(function(v) {return v[0]}));
	}
	
	function _tokenizeWord(word, suffix=false)
	{
		var tokens = [];
		if(word == null || word.length == 0)
			return tokens;
		
		for (let i = 0; i < word.length; i++)
		{
			var subword = word.substring(0, word.length - i);
			var subwordKey = subword;
			
			if(suffix)
				subwordKey = "##" + subwordKey;
			
			if (subword.length >= 1)
			{
				if(subwordKey in vocabulary._vocabularyMap)
				{
					tokens.push(vocabulary._vocabularyMap[subwordKey]);
					var nextSubword = word.substring(word.length - i, word.length);
					tokens = tokens.concat(_tokenizeWord(nextSubword, true));
					break;
				}
				else if(word.length == 1)
				{
					tokens.push(vocabulary._vocabularyMap["[UNK]"]);
				}
			}
		}
		return tokens;
	}
	
	var t = [];
	var words = _splitAndNormalize(inputText);
	for (word of words)
		t = t.concat(_tokenizeWord(word));
	
	return t;
}

function tokenizerDecode(vocabulary, tokens)
{
	function _leading_white_space(_subword, _last_subword)
	{
		if(_last_subword == "")
			return false;
		if(_subword.includes("##"))
			return false;
		if(punctuation.includes(_subword))
			return false;
		if(_subword in specialCharacters || _subword in specialCharacters)
			return false;
		if(closingBrackets.includes(_subword))
			return false;
		if(openingBrackets.includes(_last_subword))
			return false;
		if(_subword == "-" || _last_subword == "-")
			return false;
		
		return true;
	}
	
	function _is_capatalized(_last_subword)
	{
		return sentenceDelimiters.includes(_last_subword) || _last_subword == "" || _last_subword in specialCharacters;
	}
	
	function _capatalize(_word)
	{
		return _word;
		return _word.charAt(0).toUpperCase() + _word.slice(1);
	}
	
	last_subword = "";
	output = "";
	for (token of tokens)
	{
		var subword = vocabulary._inverseMap[token];
		
		if(_leading_white_space(subword, last_subword))
			output = output + " ";
		
		if (subword.includes("##"))
			subword = subword.replace("##", "");
		
		if(_is_capatalized(last_subword))
			subword = _capatalize(subword);
		
		output += subword;
		last_subword = subword;
	}
	
	return output;
}