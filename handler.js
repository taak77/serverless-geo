'use strict';

const bluebird = require('bluebird');
const maxmind = require('maxmind');
const openDb = bluebird.promisify(maxmind.open);

let cityLookup;
let countryLookup;

module.exports.fetchLocationData = async (event = {}, context) => {
	if (event.source === 'serverless-plugin-warmup') {
		console.log('WarmUP - Lambda is warm!');
		return Promise.resolve('Lambda is warm!');
	}

	const {
		headers = {},
		queryStringParameters = {},
		requestContext = {}
	} = event;
	const isDebug = queryStringParameters.debug === 'true';

	if (queryStringParameters.mock) {
		return Promise.resolve(queryStringParameters.mock === 'event' ? {
			event: event
		} : {
			context: context
		});
	}

	if (!cityLookup) {
		cityLookup = await openDb('./GeoLite2-City.mmdb');
	}

	if (!countryLookup) {
		countryLookup = await openDb('./GeoLite2-Country.mmdb');
	}

	let ip;
	let device;
	let cityData;
	let countryData;

	let response = {};

	try {
		if (headers['CloudFront-Is-Desktop-Viewer'] === 'true') {
			device = 'desktop';
		} else if (headers['CloudFront-Is-Mobile-Viewer'] === 'true') {
			device = 'mobile';
		} else if (headers['CloudFront-Is-SmartTV-Viewer'] === 'true') {
			device = 'smarttv';
		} else if (headers['CloudFront-Is-Tablet-Viewer'] === 'true') {
			device = 'tablet';
		}
		ip = requestContext.identity.sourceIp;
		cityData = await cityLookup.get(ip);
		countryData = await countryLookup.get(ip);

		response = {
			statusCode: 200,
			body: JSON.stringify({
				success: true,
				device: device,
				ip: ip,
				city: cityData,
				country: countryData
			})
		};
	} catch (err) {
		console.log('Lookup failed!', err);
		response = {
			statusCode: 500,
			body: JSON.stringify({
				success: false,
				error: err.message
			})
		};
	}

	response = {
		...response,
		env: requestContext.stage
	};

	if (isDebug) {
		response = {
			...response,
			event: event,
			context: context
		};
	}

	return Promise.resolve(response);
};
