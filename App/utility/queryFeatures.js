class QueryFeatures {
	constructor(query, queryObj) {
		this.query = query;
		this.queryObj = queryObj;
	}

	filter() {
		const qo = { ...this.queryObj };
		const excludedFields = [
			'page',
			'limit',
			'sort',
			'fields',
			'select',
			// 'name',
			// 'categories',
			// 'brand',
			// 'priceRange',
			// 'keywords'
		];
		excludedFields.forEach((field) => delete qo[field]);

		if (qo.name) {
			qo.name = { $regex: new RegExp(qo.name, 'i') };
		}

		if (qo.keywords) {
			qo.keywords = {
				$in: qo.keywords.split(',').map((e) => e.trim().toLowerCase()),
			};
		}

		if (qo.categories) {
			qo.categories = { $in: qo.categories.split(',') };
		}

		if (qo.brand) {
			qo['$or'] = qo.brand.split(',').map((brand) => ({ brand: brand }));
			delete qo.brand;
		}

		if (qo.priceRange) {
			const pr = qo.priceRange.split(',');
			qo['$and'] = [{ price: { $gte: +pr[0] } }, { price: { $lte: +pr[1] } }];
			delete qo.priceRange;
		}

		this.query = this.query.find(qo);

		return this;
	}

	pagination() {
		const page = this.queryObj.page * 1 || 1;
		const limit = this.queryObj.limit * 1 || 10;
		const skip = (page - 1) * limit;

		this.query = this.query.skip(skip).limit(limit);

		return this;
	}

	sort() {
		if (this.queryObj.sort) {
			const sortBy = this.queryObj.sort.split(',').join(' ');
			this.query = this.query.sort(sortBy);
		}

		return this;
	}

	limitFields() {
		if (this.queryObj.fields) {
			const fields = this.queryObj.fields.split(',').join(' ');
			this.query = this.query.select(fields);

			if (this.queryObj.fields.includes('categories')) {
				this.query = this.query.populate('categories', 'name');
			}
		}

		return this;
	}

	select() {
		if (this.queryObj.select) {
			const select = this.queryObj.select
				.split(',')
				.map((e) => `+${e}`)
				.join(' ');

			this.query = this.query.select(select);
		}

		return this;
	}
}

module.exports = QueryFeatures;
