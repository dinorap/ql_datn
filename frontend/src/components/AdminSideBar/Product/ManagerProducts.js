import { useState, useEffect } from "react";
import TableProducts from "./TableProducts";

import ModalDeleteProduct from "./ModalDeleteProduct";
import ModalViewProduct from "./ModalViewProduct";
import { getAllProductsWithPaginate } from "../../../services/apiProductService";
import ModalViewVariant from "./ModalViewVariant";
import ModalProductForm from "./ModalProductForm";

import ModalCreateVariant from "./ModalCreateVariant";
import ModalUpdateVariant from "./ModalUpdateVariant";
import ModalOptionForm from "./ModalOptionForm";

const LIMIT = 10;

const ManagerProducts = ({ category_id }) => {
    useEffect(() => {
        fetchListWithPaginate(1);
        setCurrentPage(1)
    }, []);
    const [list, setList] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [dataUpdate, setDataUpdate] = useState({});
    const [dataUpdateVariant, setDataUpdateVariant] = useState({});
    const [dataUpdateOption, setDataUpdateOption] = useState({});
    const [dataDelete, setDataDelete] = useState({});
    const [dataView, setDataView] = useState({});
    const [dataViewVariant, setDataViewVariant] = useState({});
    const [showModalCreate, setShowModalCreate] = useState(false);
    const [showModalCreateVariant, setShowModalCreateVariant] = useState(false);
    const [productId, setProductId] = useState('');
    const [variantID, setVariantID] = useState('');
    const [showModalCreateOption, setShowModalCreateOption] = useState(false);
    const [showModalUpdateOption, setShowModalUpdateOption] = useState(false);
    const [showModalUpdate, setShowModalUpdate] = useState(false);
    const [showModalUpdateVariant, setShowModalUpdateVariant] = useState(false);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showModalView, setShowModalView] = useState(false);
    const [showModalViewVariant, setShowModalViewVariant] = useState(false);
    const [type, setType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('');

    const fetchListWithPaginate = async (page, searchType, searchTerm) => {
        let res = await getAllProductsWithPaginate(page, LIMIT, searchType, searchTerm, category_id);
        if (res.EC === 0) {
            setList(res.data.products);
            setPageCount(res.data.totalPage);
            setRowCount(res.data.totalRow);
            setCurrentPage(page);
        }
    };

    const handleView = (product) => {
        setShowModalView(true);
        setDataView(product);
    };
    const handleCreateOption = (VariantID, searchType, searchTerm) => {
        setShowModalCreateOption(true);
        setVariantID(VariantID);
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    };

    const handleCreateVariant = (productId, searchType, searchTerm) => {
        setShowModalCreateVariant(true);
        setProductId(productId);
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    };

    const handleViewVariant = (product) => {
        setShowModalViewVariant(true);
        setDataViewVariant(product);
    };

    const handleUpdate = (product, searchType, searchTerm) => {
        setShowModalUpdate(true);
        setDataUpdate(product);
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    };
    const handleUpdateVariant = (product, searchType, searchTerm) => {
        setShowModalUpdateVariant(true);
        setDataUpdateVariant(product);
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    };
    const handleUpdateOption = (product, searchType, searchTerm) => {
        setShowModalUpdateOption(true);
        setDataUpdateOption(product);
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    };

    const handleDelete = (product, type, searchType, searchTerm) => {
        setType(type)
        setShowModalDelete(true);
        setDataDelete(product);
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    };


    return (
        <>
            <TableProducts
                list={list}
                fetchListWithPaginate={fetchListWithPaginate}
                setCurrentPage={setCurrentPage}
                handleView={handleView}
                handleViewVariant={handleViewVariant}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                handleCreateVariant={handleCreateVariant}
                handleUpdateVariant={handleUpdateVariant}
                handleCreateOption={handleCreateOption}
                setShowModalCreate={setShowModalCreate}
                handleUpdateOption={handleUpdateOption}
                pageCount={pageCount}
                rowCount={rowCount}
                currentPage={currentPage}
            />
            <ModalProductForm
                show={showModalCreate}
                setShow={setShowModalCreate}
                category_id={category_id}
                currentPage={currentPage}
                fetchListWithPaginate={fetchListWithPaginate}
                mode="create"

            />

            <ModalProductForm
                show={showModalUpdate}
                setShow={setShowModalUpdate}
                category_id={category_id}
                currentPage={currentPage}
                fetchListWithPaginate={fetchListWithPaginate}
                mode="edit"
                dataUpdate={dataUpdate}
                searchType={searchType}
                searchTerm={searchTerm}
            />

            <ModalCreateVariant
                show={showModalCreateVariant}
                setShow={setShowModalCreateVariant}
                product_id={productId}
                currentPage={currentPage}
                fetchListWithPaginate={fetchListWithPaginate}
                searchType={searchType}
                searchTerm={searchTerm}
            />
            <ModalUpdateVariant
                show={showModalUpdateVariant}
                setShow={setShowModalUpdateVariant}
                currentPage={currentPage}
                fetchListWithPaginate={fetchListWithPaginate}
                dataUpdate={dataUpdateVariant}
                searchType={searchType}
                searchTerm={searchTerm}
            />

            <ModalOptionForm
                show={showModalCreateOption}
                setShow={setShowModalCreateOption}
                variant_id={variantID}
                currentPage={currentPage}
                fetchListWithPaginate={fetchListWithPaginate}
                mode="create"
                searchType={searchType}
                searchTerm={searchTerm}
            />

            <ModalOptionForm
                show={showModalUpdateOption}
                setShow={setShowModalUpdateOption}
                currentPage={currentPage}
                fetchListWithPaginate={fetchListWithPaginate}
                dataUpdate={dataUpdateOption}
                mode="edit"
                searchType={searchType}
                searchTerm={searchTerm}
            />

            <ModalDeleteProduct
                type={type}
                show={showModalDelete}
                setShow={setShowModalDelete}
                dataDelete={dataDelete}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                searchType={searchType}
                searchTerm={searchTerm}
            />

            <ModalViewProduct
                show={showModalView}
                setShow={setShowModalView}
                dataView={dataView}
            />
            <ModalViewVariant
                show={showModalViewVariant}
                setShow={setShowModalViewVariant}
                dataView={dataViewVariant}
            />
        </>
    );
};

export default ManagerProducts;
