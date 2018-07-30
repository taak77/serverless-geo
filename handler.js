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
		requestContext = {}
	} = event;
	// `queryStringParameters` defaults to `null`
	const queryStringParameters = event.queryStringParameters || {};
	const isDebug = queryStringParameters.debug === 'true';

	if (queryStringParameters.mock) {
		return Promise.resolve({
			statusCode: 200,
			body: JSON.stringify(queryStringParameters.mock === 'event' ? {
				event
			} : {
				context
			})
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

	let statusCode = 200;
	let body = {};

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

		body = {
			success: true,
			device,
			ip,
			city: cityData,
			country: countryData
		};
	} catch (err) {
		console.log('Lookup failed!', err);
		statusCode = 500;
		body = {
			success: false,
			error: err.message
		};
	}

	body = {
		...body,
		env: requestContext.stage
	};

	if (isDebug) {
		body = {
			...body,
			event,
			context
		};
	}

	return Promise.resolve({
		statusCode,
		body: JSON.stringify(body)
	});
};
