import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllProductSpecifications, getAllProductsSearch } from "../../../services/apiViewService";
import Button from 'antd/es/button';
import 'antd/es/button/style';

import Rate from 'antd/es/rate';
import 'antd/es/rate/style';

import Tag from 'antd/es/tag';
import 'antd/es/tag/style';

import Pagination from 'antd/es/pagination';
import 'antd/es/pagination/style';

import Slider from 'antd/es/slider';
import 'antd/es/slider/style';

import Checkbox from 'antd/es/checkbox';
import 'antd/es/checkbox/style';

import InputNumber from 'antd/es/input-number';
import 'antd/es/input-number/style';

import Collapse from 'antd/es/collapse';
import 'antd/es/collapse/style';

import Select from 'antd/es/select';
import 'antd/es/select/style';

import Dropdown from 'antd/es/dropdown';
import 'antd/es/dropdown/style';

import './Search.scss';
import { IoFilterSharp } from "react-icons/io5";
import { CiCirclePlus } from "react-icons/ci";
import { toast } from "react-toastify";
import CompareBar from "../../../components/ViewProduct/CompareBar";

const LIMIT = 20;
const { Panel } = Collapse;
const { Option } = Select;

const SearchResultPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get('keyword');
    const [products, setProducts] = useState([]);
    const [totalRow, setTotalRow] = useState(0);
    const [totalPage, setTotalPage] = useState(0);
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
    const [filterAll, setFilterAll] = useState();
    const [filters, setFilters] = useState({});
    const [sortKey, setSortKey] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [selectedRanges, setSelectedRanges] = useState([]);
    const [filterLabels, setFilterLabels] = useState([]);
    const navigate = useNavigate();

    const updateURLParams = (newParams) => {
        const current = Object.fromEntries([...searchParams]);
        const updated = { ...current, ...newParams };

        Object.keys(updated).forEach(key => {
            if (
                (updated[key] === null || updated[key] === undefined || updated[key] === '') &&
                key !== 'keyword'
            ) {
                delete updated[key];
            }
        });

        setSearchParams(updated);
    };


    const fetchProducts = async (customFilters = {}) => {
        const payload = {
            search: keyword,
            page: currentPage,
            limit: LIMIT,
            sortKey,
            sortOrder,
            ...customFilters,

        };
        if (keyword?.trim()) {
            payload.search = keyword.trim();
        }
        if (selectedRanges.length > 0) {
            payload.price_ranges = JSON.stringify(selectedRanges);
        } else {
            if (filters.min_price !== undefined) payload.min_price = filters.min_price;
            if (filters.max_price !== undefined) payload.max_price = filters.max_price;
        }

        const res = await getAllProductsSearch(payload);
        if (res?.EC === 0) {
            setProducts(res.data.products);
            setTotalRow(res.data.totalRow);
            setTotalPage(res.data.totalPage);
            const maxPage = res.data.totalPage || 1;
            if (currentPage > maxPage) {
                updateURLParams({ page: 1 });
                setCurrentPage(1);
            }
        }
    };

    const fetchFilter = async () => {
        const res = await getAllProductSpecifications();
        if (res?.EC === 0) setFilterAll(res.data);
    };

    useEffect(() => { fetchFilter(); }, []);

    useEffect(() => {
        const queryFilters = {};
        for (const [key, value] of searchParams.entries()) {
            queryFilters[key] = value;
        }
        if (queryFilters.price_ranges) setSelectedRanges(JSON.parse(queryFilters.price_ranges));
        setFilters(queryFilters);
        if (queryFilters.page) setCurrentPage(Number(queryFilters.page));
        if (queryFilters.sort) {
            if (queryFilters.sort === 'newest') {
                setSortKey('release_date');
                setSortOrder('DESC');
            } else if (queryFilters.sort === 'price_asc') {
                setSortKey('final_price');
                setSortOrder('ASC');
            } else if (queryFilters.sort === 'price_desc') {
                setSortKey('final_price');
                setSortOrder('DESC');
            } else {
                setSortKey('');
                setSortOrder('');
            }
        }
    }, []);
    useEffect(() => {
        if (keyword !== null) fetchProducts(filters);
    }, [keyword, currentPage, filters, sortKey, sortOrder, selectedRanges]);
    useEffect(() => {
        if (!filterAll) return;
        const queryFilters = {};
        for (const [key, value] of searchParams.entries()) {
            queryFilters[key] = value;
        }

        if (Object.keys(queryFilters).length === 0) {
            setFilters({});
            setSelectedRanges([]);
            setSelectedScreenRanges([]);
            setFilterLabels([]);
            setSortKey('');
            setSortOrder('');
            setCurrentPage(1);
        } else {
            if (queryFilters.price_ranges) {
                try {
                    setSelectedRanges(JSON.parse(queryFilters.price_ranges));
                } catch (e) {
                    console.error("Invalid price_ranges format");
                }
            }

            if (queryFilters.screen_ranges) {
                try {
                    setSelectedScreenRanges(JSON.parse(queryFilters.screen_ranges));
                } catch (e) {
                    console.error("Invalid screen_ranges format");
                }
            }

            const labelFields = [
                'ram',
                'rom',
                'gift',
                'material',
                'screen_technology',
                'operating_system',
                'refresh_rate',
                'charging_port'
            ];
            let restoredLabels = [];

            labelFields.forEach((field) => {
                if (queryFilters[field]) {
                    const values = queryFilters[field].split(',');
                    restoredLabels.push(...values);
                }
            });

            if (queryFilters.company_id && filterAll?.company) {
                const ids = queryFilters.company_id.split(',');
                const companyLabels = ids
                    .map(id => filterAll.company.find(c => String(c.value) === id)?.label)
                    .filter(Boolean);
                restoredLabels.push(...companyLabels);
            }
            if (queryFilters.category_id && filterAll?.category) {
                const ids = queryFilters.category_id.split(',');
                const categoryLabels = ids
                    .map(id => filterAll.category.find(c => String(c.value) === id)?.label)
                    .filter(Boolean);
                restoredLabels.push(...categoryLabels);
            }

            setFilterLabels(restoredLabels);
            setFilters(queryFilters);

            if (queryFilters.page) setCurrentPage(Number(queryFilters.page));

            if (queryFilters.sort) {
                if (queryFilters.sort === 'newest') {
                    setSortKey('release_date');
                    setSortOrder('DESC');
                } else if (queryFilters.sort === 'price_asc') {
                    setSortKey('final_price');
                    setSortOrder('ASC');
                } else if (queryFilters.sort === 'price_desc') {
                    setSortKey('final_price');
                    setSortOrder('DESC');
                } else {
                    setSortKey('');
                    setSortOrder('');
                }
            }

        }
    }, [searchParams, filterAll]);


    const handleAntdPageChange = (page) => {
        updateURLParams({ page }); setCurrentPage(page);
    };


    const handleFilterChange = (field, value) => {
        const updatedFilters = { ...filters, [field]: value };
        setFilters(updatedFilters);
        updateURLParams({ [field]: value });
    };

    const predefinedRanges = [
        { label: "Dưới 2 triệu", value: [0, 2000000] },
        { label: "Từ 2 - 4 triệu", value: [2000000, 4000000] },
        { label: "Từ 4 - 7 triệu", value: [4000000, 7000000] },
        { label: "Từ 7 - 13 triệu", value: [7000000, 13000000] },
        { label: "Từ 13 - 20 triệu", value: [13000000, 20000000] },
        { label: "Trên 20 triệu", value: [20000000, filterAll?.max_price] },
    ];

    const toggleRange = (range) => {
        const exists = selectedRanges.find(r => r[0] === range[0] && r[1] === range[1]);
        let newRanges;

        if (exists) {
            newRanges = selectedRanges.filter(r => !(r[0] === range[0] && r[1] === range[1]));
        } else {
            newRanges = [...selectedRanges, range];
        }

        setSelectedRanges(newRanges);
        setFilters(prev => ({
            ...prev,
            pricePreset: null
        }));

        if (newRanges.length === 0) {
            updateURLParams({ price_ranges: null });
        } else {
            updateURLParams({ price_ranges: JSON.stringify(newRanges) });
        }
    };

    const sortMemoryOptions = (list) => {
        const convertToGB = (val) => {
            const number = parseFloat(val);
            if (val.toUpperCase().includes('TB')) return number * 1024;
            if (val.toUpperCase().includes('GB')) return number;
            return 0;
        };
        return [...list].sort((a, b) => convertToGB(a) - convertToGB(b));
    };

    const [showFilter, setShowFilter] = useState(true);
    const [selectedScreenRanges, setSelectedScreenRanges] = useState([]);
    const toggleScreenRange = (range) => {
        const exists = selectedScreenRanges.find(r => r[0] === range[0] && r[1] === range[1]);
        let newRanges;

        if (exists) {
            newRanges = selectedScreenRanges.filter(r => !(r[0] === range[0] && r[1] === range[1]));
        } else {
            newRanges = [...selectedScreenRanges, range];
        }

        setSelectedScreenRanges(newRanges);

        if (newRanges.length === 0) {
            updateURLParams({ screen_ranges: null });
        } else {
            updateURLParams({ screen_ranges: JSON.stringify(newRanges) });
        }
    };

    const [openCompanyDropdown, setOpenCompanyDropdown] = useState(false);

    const [compareItems, setCompareItems] = useState([]); const handleAddToCompare = (product) => {
        if (compareItems.length === 0) {
            setCompareItems([product]);
            return;
        }

        const currentCategory = compareItems[0].category_id;

        if (product.category_id !== currentCategory) {

            setCompareItems([product]);
            return;
        }

        if (compareItems.find((p) => p.product_id === product.product_id)) return;


        if (compareItems.length >= 3) {
            toast.warn("Chỉ được so sánh tối đa 3 sản phẩm!");
            return;
        }

        setCompareItems([...compareItems, product]);

    };
    const isCompared = (product) =>
        compareItems.some((item) => item.product_id === product.product_id);


    const screenRangeLabels = [
        { label: 'Từ 5 - 6.5 inch', value: [5.0, 6.5] },
        { label: 'Từ 6.5 - 7 inch', value: [6.5, 7] },
        { label: 'Từ 7 - 10 inch', value: [7, 10] },
        { label: 'Từ 10 - 15 inch', value: [10, 15] },
        { label: 'Trên 15 inch', value: [15, 100] },
    ];
    return (
        <>

            < div className="search-page-container">
                {showFilter && (
                    <div className="filter-sidebar">
                        <div className="title-filter" onClick={() => setShowFilter(false)}>
                            <IoFilterSharp /> Bộ lọc tìm kiếm
                        </div>
                        <Collapse defaultActiveKey={['price', 'os', 'ram', 'rom', 'connect', 'cpu', 'gift', 'category', 'material', 'refresh_rate', 'screen_tech', 'screen']}>
                            {filterAll?.min_price !== undefined && filterAll?.max_price !== undefined && (
                                <Panel header="Mức giá" key="price">
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <Checkbox
                                            checked={selectedRanges.length === 0 && !filters.pricePreset}
                                            onChange={() => {
                                                setSelectedRanges([]);
                                                setFilters(prev => ({
                                                    ...prev,
                                                    min_price: filterAll.min_price,
                                                    max_price: filterAll.max_price,
                                                    pricePreset: null,
                                                }));

                                                handleFilterChange('min_price', filterAll.min_price);
                                                handleFilterChange('max_price', filterAll.max_price);
                                                updateURLParams({ price_ranges: null, page: 1 });
                                            }}
                                        >
                                            Tất cả
                                        </Checkbox>


                                        {predefinedRanges.map((item, idx) => (
                                            <Checkbox
                                                key={idx}
                                                checked={selectedRanges.some(r => r[0] === item.value[0] && r[1] === item.value[1])}
                                                onChange={() => toggleRange(item.value)}
                                            >
                                                {item.label}
                                            </Checkbox>
                                        ))}

                                        <div style={{ marginTop: 12, fontSize: 13, color: '#555', textAlign: 'left' }}>
                                            Hoặc nhập khoảng giá phù hợp với bạn:
                                        </div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                            <InputNumber
                                                min={Number(filterAll.min_price)}
                                                max={Number(filterAll.max_price)}
                                                value={filters.min_price || Number(filterAll.min_price)}
                                                onChange={(val) => {
                                                    setSelectedRanges([]);
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        min_price: val || filterAll.min_price,
                                                        pricePreset: null
                                                    }));
                                                    updateURLParams({ price_ranges: null, page: 1 });
                                                }}
                                                formatter={(v) => `${Number(v).toLocaleString()}đ`}
                                                parser={(v) => parseInt(v.replace(/[^\d]/g, ''))}
                                                style={{ width: "45%" }}
                                            />
                                            <span>~</span>
                                            <InputNumber
                                                min={Number(filterAll.min_price)}
                                                max={Number(filterAll.max_price)}
                                                value={filters.max_price || Number(filterAll.max_price)}
                                                onChange={(val) => {
                                                    setSelectedRanges([]);
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        max_price: val || filterAll.max_price,
                                                        pricePreset: null
                                                    }));
                                                    updateURLParams({ price_ranges: null, page: 1 });
                                                }}
                                                formatter={(v) => `${Number(v).toLocaleString()}đ`}
                                                parser={(v) => parseInt(v.replace(/[^\d]/g, ''))}
                                                style={{ width: "45%" }}
                                            />
                                        </div>

                                        <Slider
                                            style={{ marginTop: 8 }}
                                            range
                                            step={100000}
                                            min={Number(filterAll.min_price)}
                                            max={Number(filterAll.max_price)}
                                            value={[
                                                Number(filters.min_price || filterAll.min_price),
                                                Number(filters.max_price || filterAll.max_price),
                                            ]}
                                            onChange={(val) => {
                                                setSelectedRanges([]);
                                                setFilters(prev => ({
                                                    ...prev,
                                                    min_price: val[0],
                                                    max_price: val[1],
                                                    pricePreset: null
                                                }));
                                                updateURLParams({ price_ranges: null, page: 1 });
                                            }}
                                        />
                                    </div>
                                </Panel>
                            )}
                            {filterAll?.category && (
                                <Panel header="Loại sản phẩm" key="category">
                                    <div className="checkbox-vertical">
                                        <Checkbox
                                            checked={!filters.category_id}
                                            onChange={() => handleFilterChange('category_id', null)}
                                        >
                                            Tất cả
                                        </Checkbox>

                                        <Checkbox.Group
                                            className="checkbox-vertical"
                                            options={filterAll.category}
                                            value={filters.category_id ? filters.category_id.split(',').map(Number) : []}
                                            onChange={(vals) => {
                                                const joined = vals.join(',');
                                                handleFilterChange('category_id', joined || null);
                                            }}
                                        />
                                    </div>
                                </Panel>
                            )}
                            {filterAll?.screen && (
                                <Panel header="Màn hình" key="screen">
                                    <div className="checkbox-vertical">
                                        <Checkbox
                                            checked={!filters.screen_ranges}
                                            onChange={() => {
                                                setSelectedScreenRanges([]);
                                                handleFilterChange('screen_ranges', null);
                                            }}
                                        >
                                            Tất cả
                                        </Checkbox>

                                        {screenRangeLabels.map((item, idx) => (
                                            <Checkbox
                                                key={idx}
                                                checked={selectedScreenRanges.some(
                                                    r => r[0] === item.value[0] && r[1] === item.value[1]
                                                )}
                                                onChange={() => toggleScreenRange(item.value)}
                                                style={{ marginBottom: 6 }}
                                            >
                                                {item.label}
                                            </Checkbox>
                                        ))}
                                    </div>
                                </Panel>
                            )}

                            {filterAll?.operating_system && (
                                <Panel header="Hệ điều hành" key="os">
                                    <Checkbox.Group
                                        className="toggle-button-group"
                                        options={filterAll.operating_system.map(item => ({
                                            label: item,
                                            value: item
                                        }))}
                                        value={filters.operating_system?.split(',') || []}
                                        onChange={(vals) => handleFilterChange('operating_system', vals.join(','))}
                                    />
                                </Panel>
                            )}


                            {filterAll?.ram && (
                                <Panel header="RAM" key="ram">
                                    <Checkbox.Group
                                        className="toggle-button-group"
                                        options={sortMemoryOptions(filterAll.ram).map(item => ({
                                            label: item,
                                            value: item
                                        }))}
                                        value={filters.ram?.split(',') || []}
                                        onChange={(vals) => handleFilterChange('ram', vals.join(','))}
                                    />
                                </Panel>
                            )}

                            {filterAll?.rom && (
                                <Panel header="ROM" key="rom">
                                    <Checkbox.Group
                                        className="toggle-button-group"
                                        options={sortMemoryOptions(filterAll.rom).map(item => ({
                                            label: item,
                                            value: item
                                        }))}
                                        value={filters.rom?.split(',') || []}
                                        onChange={(vals) => handleFilterChange('rom', vals.join(','))}
                                    />
                                </Panel>
                            )}

                            {filterAll?.charging_port && (
                                <Panel header="Kết nối" key="connect">
                                    <Checkbox.Group
                                        className="toggle-button-group"
                                        options={filterAll.charging_port.map(item => ({
                                            label: item,
                                            value: item
                                        }))}
                                        value={filters.charging_port?.split(',') || []}
                                        onChange={(vals) => handleFilterChange('charging_port', vals.join(','))}
                                    />
                                </Panel>
                            )}
                            {filterAll?.material && (
                                <Panel header="Chất liệu" key="material">
                                    <Checkbox.Group
                                        className="toggle-button-group"
                                        options={filterAll.material.map(item => ({
                                            label: item,
                                            value: item
                                        }))}
                                        value={filters.material?.split(',') || []}
                                        onChange={(vals) => handleFilterChange('material', vals.join(','))}
                                    />
                                </Panel>
                            )}

                            {filterAll?.refresh_rate && (
                                <Panel header="Tần số quét" key="refresh_rate">
                                    <Checkbox.Group
                                        className="toggle-button-group"
                                        options={filterAll.refresh_rate.map(item => ({
                                            label: item,
                                            value: item
                                        }))}
                                        value={filters.refresh_rate?.split(',') || []}
                                        onChange={(vals) => handleFilterChange('refresh_rate', vals.join(','))}
                                    />
                                </Panel>
                            )}

                            {filterAll?.screen_technology && (
                                <Panel header="Công nghệ màn hình" key="screen_tech">
                                    <Checkbox.Group
                                        className="toggle-button-group"
                                        options={filterAll.screen_technology.map(item => ({
                                            label: item,
                                            value: item
                                        }))}
                                        value={filters.screen_technology?.split(',') || []}
                                        onChange={(vals) => handleFilterChange('screen_technology', vals.join(','))}
                                    />
                                </Panel>
                            )}


                            {filterAll?.gift && (
                                <Panel header="Nhu cầu" key="gift">
                                    <Checkbox.Group className="checkbox-vertical" options={filterAll.gift} onChange={(vals) => handleFilterChange('gift', vals.join(','))} />
                                </Panel>
                            )}
                        </Collapse>
                    </div>
                )}


                <div className="search-content">
                    <div className="search-item">
                        <div className="sort-item">
                            <div className="show-result">
                                {!showFilter && (
                                    <div className="show-hide">
                                        <Button

                                            className="show-filter-btn"
                                            onClick={() => setShowFilter(true)}
                                        >
                                            <IoFilterSharp /> Bộ lọc
                                        </Button>
                                    </div>
                                )}
                                <div>
                                    Tìm thấy <strong>{totalRow}</strong> kết quả
                                </div>
                            </div>
                            <div className="fast-sort">
                                <Dropdown

                                    open={openCompanyDropdown}
                                    onOpenChange={setOpenCompanyDropdown}
                                    overlay={
                                        <div className="company-filter-wrapper">
                                            <div className="company-grid">
                                                {filterAll?.company?.map(c => {
                                                    const selected = filters.company_id?.split(',') || [];
                                                    const isSelected = selected.includes(String(c.value));
                                                    return (
                                                        <Button
                                                            key={c.value}
                                                            className={`company-button ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                const newSelected = isSelected
                                                                    ? selected.filter(id => id !== String(c.value))
                                                                    : [...selected, String(c.value)];
                                                                handleFilterChange('company_id', newSelected.length ? newSelected.join(',') : null);
                                                            }}
                                                        >
                                                            {c.label.charAt(0).toUpperCase() + c.label.slice(1)}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <div className="company-filter-actions">
                                                <Button className="drop-company" danger onClick={() => handleFilterChange('company_id', null)}>
                                                    Bỏ chọn
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                    trigger={['click']}
                                    placement="bottomLeft"
                                >
                                    <div className="fast-filter">
                                        <span className="sort-label">Lọc nhanh:</span>
                                        <Button
                                            className={`${filters.company_id ? 'has-selected' : ''} company`}
                                        >
                                            Hãng sản xuất {filters.company_id ? `(${filters.company_id.split(',').length})` : ''}
                                            <span style={{ marginLeft: -3, color: "gray" }}>
                                                {openCompanyDropdown ? '▲' : '▼'}
                                            </span>
                                        </Button>
                                    </div>
                                </Dropdown>

                                <div className="sort-dropdown">
                                    <span className="sort-label">Sắp xếp theo:</span>
                                    <Select
                                        defaultValue="popular"
                                        style={{ width: 180 }}
                                        onChange={(val) => {
                                            if (val === 'popular') {
                                                setSortKey('');
                                                setSortOrder('');
                                            } else if (val === 'newest') {
                                                setSortKey('release_date');
                                                setSortOrder('DESC');
                                            } else if (val === 'price_asc') {
                                                setSortKey('final_price');
                                                setSortOrder('ASC');
                                            } else if (val === 'price_desc') {
                                                setSortKey('final_price');
                                                setSortOrder('DESC');
                                            }
                                        }}
                                    >
                                        <Option value="popular">Nổi bật</Option>
                                        <Option value="newest">Mới nhất</Option>
                                        <Option value="price_asc">Giá thấp nhất</Option>
                                        <Option value="price_desc">Giá cao nhất</Option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="show-filter">

                            {filterLabels.map((label) => {
                                let matchedField = null;
                                if (filterAll?.screen_technology?.includes(label)) matchedField = 'screen_technology';
                                else if (filterAll?.gift?.includes(label)) matchedField = 'gift';
                                else if (filterAll?.ram?.includes(label)) matchedField = 'ram';
                                else if (filterAll?.rom?.includes(label)) matchedField = 'rom';
                                else if (filterAll?.material?.includes(label)) matchedField = 'material';
                                else if (filterAll?.refresh_rate?.includes(label)) matchedField = 'refresh_rate';
                                else if (filterAll?.charging_port?.includes(label)) matchedField = 'charging_port';
                                else if (filterAll?.operating_system?.includes(label)) matchedField = 'operating_system';
                                else if (filterAll?.company?.some(c => c.label === label)) matchedField = 'company';
                                else if (filterAll?.category?.some(c => c.label === label)) matchedField = 'category';
                                return (
                                    <Tag
                                        key={label}
                                        closable
                                        onClose={() => {

                                            if (matchedField === 'category') {
                                                const removedId = filterAll.category.find(c => c.label === label)?.value?.toString();
                                                const currentIds = (filters.category_id || '').split(',').filter(id => id !== removedId);
                                                const newValue = currentIds.length ? currentIds.join(',') : null;
                                                handleFilterChange('category_id', newValue);

                                            } else if (matchedField === 'company') {
                                                const removedId = filterAll.company.find(c => c.label === label)?.value?.toString();
                                                const currentIds = (filters.company_id || '').split(',').filter(id => id !== removedId);
                                                const newValue = currentIds.length ? currentIds.join(',') : null;
                                                handleFilterChange('company_id', newValue);

                                            } else {
                                                const newVals = (filters[matchedField]?.split(',') || []).filter(i => i !== label);
                                                handleFilterChange(matchedField, newVals.join(','));

                                            }


                                        }}
                                    >
                                        {label}
                                    </Tag>
                                );
                            })}

                            {selectedRanges.map((range, idx) => {
                                const matchedLabel = predefinedRanges.find(r => r.value[0] === range[0] && r.value[1] === range[1])?.label;
                                return (
                                    <Tag key={`price-${idx}`} closable onClose={() => toggleRange(range)}>
                                        {matchedLabel || `${range[0].toLocaleString()}đ - ${range[1].toLocaleString()}đ`}
                                    </Tag>
                                );
                            })}

                            {filters.pricePreset === null && selectedRanges.length === 0 &&
                                (filters.min_price !== filterAll.min_price || filters.max_price !== filterAll.max_price) && (
                                    <Tag closable onClose={() => {
                                        setFilters(prev => ({
                                            ...prev,
                                            min_price: filterAll.min_price,
                                            max_price: filterAll.max_price
                                        }));
                                    }}>
                                        {`${Number(filters.min_price).toLocaleString()}đ - ${Number(filters.max_price).toLocaleString()}đ`}
                                    </Tag>
                                )}

                            {selectedScreenRanges.map((range, idx) => {
                                const matchedLabel = screenRangeLabels.find(r => r.value[0] === range[0] && r.value[1] === range[1])?.label;
                                return (
                                    <Tag key={`screen-${idx}`} closable onClose={() => toggleScreenRange(range)}>
                                        {matchedLabel || `${range[0]} - ${range[1]} inch`}
                                    </Tag>
                                );
                            })}


                            {(filterLabels.length + selectedRanges.length + selectedScreenRanges.length +
                                (filters.pricePreset === null && selectedRanges.length === 0 &&
                                    (filters.min_price !== filterAll.min_price || filters.max_price !== filterAll.max_price) ? 1 : 0)
                            ) >= 2 && (
                                    <Button
                                        className="clear-all"
                                        type="link"
                                        onClick={() => {
                                            setFilterLabels([]);
                                            setSelectedRanges([]);
                                            setSelectedScreenRanges([]);

                                            const resetFilters = {
                                                ...filters,
                                                screen_ranges: null,
                                                price_ranges: null,
                                                min_price: filterAll.min_price,
                                                max_price: filterAll.max_price,
                                                pricePreset: null,
                                                ram: null,
                                                rom: null,
                                                gift: null,
                                                material: null,
                                                screen_technology: null,
                                                operating_system: null,
                                                refresh_rate: null,
                                                charging_port: null,
                                                company_id: null,
                                                category_id: null,
                                            };

                                            setFilters(resetFilters);

                                            updateURLParams({
                                                screen_ranges: null,
                                                price_ranges: null,
                                                min_price: null,
                                                max_price: null,
                                                pricePreset: null,
                                                ram: null,
                                                rom: null,
                                                gift: null,
                                                material: null,
                                                screen_technology: null,
                                                operating_system: null,
                                                refresh_rate: null,
                                                charging_port: null,
                                                company_id: null,
                                                category_id: null,
                                                page: 1,
                                            });
                                        }}
                                        style={{ marginLeft: 8 }}
                                    >
                                        Xóa tất cả
                                    </Button>

                                )}
                        </div>
                        <div className="top-item-section">
                            <div className='list-top-item'>
                                {products.map((product) => (
                                    <div key={product.product_id} className={!showFilter ? "flash-sale-item top-show" : "flash-sale-item top"} onClick={() => navigate(`/products/${product.product_id}`)}>
                                        {product.is_active === 0 && (

                                            <div className="overlay-disabled-1">
                                                <div className="overlay-disabled">
                                                    <p>Ngừng bán</p></div>
                                            </div>
                                        )}
                                        {product.promotion && (
                                            <div className="discount-badge">
                                                <p className='promotion-name'>{product.promotion.promotion_type_name}</p>
                                            </div>
                                        )}
                                        {product.is_installment_available === 1 && (
                                            <div className={!showFilter ? "installment-show" : "installment"}>Trả góp 0%</div>
                                        )}
                                        <div className="flash-sale-card">
                                            <div className="flash-sale-image">
                                                {product.image ? (
                                                    <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                                                ) : (
                                                    <div className="no-image">No Image</div>
                                                )}
                                            </div>
                                            <div className="flash-sale-content">
                                                <h3 className="product-name">{product.product_name}</h3>
                                                {product.ram && product.rom && (
                                                    <Tag className='option-tag'>{product.ram} / {product.rom}</Tag>
                                                )}
                                                {product.screen && (
                                                    <Tag className='option-tag'>{product.screen}"</Tag>
                                                )}
                                                {product.refresh_rate && (
                                                    <Tag className='option-tag'>{product.refresh_rate}</Tag>
                                                )}
                                                <div className="price-section">
                                                    <p className="final-price">
                                                        {product?.final_price?.toLocaleString?.()}₫
                                                        {product.promotion?.promotion_code === 'custom_price' && ' - Giá Sốc'}
                                                    </p>
                                                    {product.promotion && product.promotion.promotion_code !== 'custom_price' && (
                                                        <div>
                                                            <span className="base-price">{product?.base_price?.toLocaleString?.()}₫</span>
                                                            <span className="discount">
                                                                - {product?.promotion?.discount_value?.toLocaleString?.()}
                                                                {product.promotion.promotion_code === 'fixed_amount' ? '₫' : '%'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {product.promotion && product.promotion.promotion_code === 'custom_price' && (
                                                        <div>
                                                            <span className="base-price">{product?.base_price?.toLocaleString?.()}₫</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="rating-section">
                                                    <Rate disabled defaultValue={product.average_rating} className="rating" />
                                                    <span className="reviews">{product.total_reviews} đánh giá</span>
                                                </div>
                                                <div className="description">
                                                    <p className="description-p">{product.description}</p>
                                                </div>
                                                <button
                                                    className="compare-btn"
                                                    disabled={isCompared(product)} onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToCompare(product);
                                                    }}
                                                >
                                                    {isCompared(product) ? <><CiCirclePlus className="plus" /> Đã thêm vào so sánh</> : <><CiCirclePlus className="plus" /> So sánh</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-center mt-3">
                        <Pagination
                            current={currentPage}
                            total={totalRow}
                            pageSize={LIMIT}
                            showSizeChanger={false}
                            onChange={handleAntdPageChange}
                        />
                    </div>
                </div>
                <CompareBar
                    items={compareItems}
                    onRemove={(id) => setCompareItems(prev => prev.filter(item => item.product_id !== id))}
                    onClear={() => setCompareItems([])}
                    onCompare={() => navigate(`/compare?ids=${compareItems.map(i => i.product_id).join(',')}`)}
                />

            </div >
        </>
    );
};

export default SearchResultPage;
