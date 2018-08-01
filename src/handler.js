'use strict';

import bluebird from 'bluebird';
import maxmind from 'maxmind';
import { Devices } from "./constants";

const openDb = bluebird.promisify(maxmind.open);

// cache per container
let cityLookup;
let countryLookup;

export async function fetchLocationData(event = {}, context = {}) {
	if (event.source === 'serverless-plugin-warmup') {
		console.log('WarmUP - Lambda is warm!');
		return Promise.resolve('Lambda is warm!');
	}

	const {
		headers = {},
		requestContext = {}
	} = event;
	const queryStringParameters = event.queryStringParameters || {}; // `queryStringParameters` defaults to `null`
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

	const dbCached = !!cityLookup;

	let ip;
	let device = Devices.DESKTOP;
	let cityData;
	let countryData;
	let region;
	let statusCode = 200;
	let body = {};

	try {
		if (headers['CloudFront-Is-Desktop-Viewer'] === 'true') {
			device = Devices.DESKTOP;
		} else if (headers['CloudFront-Is-Mobile-Viewer'] === 'true') {
			device = Devices.MOBILE;
		} else if (headers['CloudFront-Is-SmartTV-Viewer'] === 'true') {
			device = Devices.SMARTTV;
		} else if (headers['CloudFront-Is-Tablet-Viewer'] === 'true') {
			device = Devices.TABLET;
		}

		ip = requestContext.identity.sourceIp;

		if (!cityLookup) {
			cityLookup = await openDb('./resources/GeoLite2-City.mmdb');
		}

		if (!countryLookup) {
			countryLookup = await openDb('./resources/GeoLite2-Country.mmdb');
		}
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

	const { invokedFunctionArn } = context;
	if (invokedFunctionArn) {
		region = invokedFunctionArn.split(':')[3];
	}

	body = {
		...body,
		env: requestContext.stage,
		region
	};

	if (isDebug) {
		body = {
			...body,
			event,
			context,
			dbCached
		};
	}

	return Promise.resolve({
		statusCode,
		body: JSON.stringify(body)
	});
}
