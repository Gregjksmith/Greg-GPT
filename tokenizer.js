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
const startSequenceCharacter = '[START_S]'
const endSequenceCharacter = '[END_S]'

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
	return new Vocabulary(await response.json());
}

async function getVocabulary()
{
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
				else if(subword.length == 1)
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
	{
		t = t.concat(_tokenizeWord(word.toLowerCase()));
	}
	
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