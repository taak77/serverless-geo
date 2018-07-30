import { fetchLocationData } from '../src/handler';
import eventData from '../mock/event.json';
import eventDataDebug from '../mock/event-debug.json';
import eventDataMobile from '../mock/event-mobile.json';
import eventDataTablet from '../mock/event-tablet.json';
import eventDataSmartTV from '../mock/event-smarttv.json';

describe('handler', () => {
	test('fetchLocationData returns proper statusCode', async () => {
		const response = await fetchLocationData(eventData);
		expect(response).toHaveProperty('statusCode', 200);
	});

	test('fetchLocationData returns `success` prop', async () => {
		const response = await fetchLocationData(eventData);
		const body = JSON.parse(response.body);
		expect(body).toHaveProperty('success', true);
	});

	test('fetchLocationData returns `ip` prop', async () => {
		const response = await fetchLocationData(eventData);
		const body = JSON.parse(response.body);
		expect(body).toHaveProperty('ip', eventData.requestContext.identity.sourceIp);
	});

	test('fetchLocationData returns `device` prop', async () => {
		const response = await fetchLocationData(eventData);
		const body = JSON.parse(response.body);
		expect(body).toHaveProperty('device', 'desktop');
	});

	test('fetchLocationData returns `env` prop', async () => {
		const response = await fetchLocationData(eventData);
		const body = JSON.parse(response.body);
		expect(body).toHaveProperty('env', 'dev');
	});

	test('fetchLocationData returns `city` prop', async () => {
		const response = await fetchLocationData(eventData);
		const body = JSON.parse(response.body);
		expect(body.city).toBeTruthy();
	});

	test('fetchLocationData returns `country` prop', async () => {
		const response = await fetchLocationData(eventData);
		const body = JSON.parse(response.body);
		expect(body.country).toBeTruthy();
	});

	test('fetchLocationData returns `event` and `context` prop', async () => {
		const response = await fetchLocationData(eventDataDebug, {});
		const body = JSON.parse(response.body);
		expect(body.event).toBeTruthy();
		expect(body.context).toBeTruthy();
	});

	test('fetchLocationData returns `device` prop as `mobile`', async () => {
		const response = await fetchLocationData(eventDataMobile, {});
		const body = JSON.parse(response.body);
		expect(body).toHaveProperty('device', 'mobile');
	});

	test('fetchLocationData returns `device` prop as `tablet`', async () => {
		const response = await fetchLocationData(eventDataTablet, {});
		const body = JSON.parse(response.body);
		expect(body).toHaveProperty('device', 'tablet');
	});

	test('fetchLocationData returns `device` prop as `smarttv`', async () => {
		const response = await fetchLocationData(eventDataSmartTV, {});
		const body = JSON.parse(response.body);
		expect(body).toHaveProperty('device', 'smarttv');
	});
});