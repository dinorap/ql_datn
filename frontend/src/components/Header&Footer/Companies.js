import { useState, useEffect } from 'react';
import { getTypeCompanies } from "../../services/apiAdvertise";
import './Companies.scss';

const TypeCompanies = ({ typeId, selectedIds = [], onCompanySelect }) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getTypeCompanies(typeId);
                setCompanies(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [typeId]);

    const handleClick = (companyId) => {
        onCompanySelect(companyId);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="companyMenu d-flex flex-wrap justify-content-center">
            {companies.map(company => {
                const isSelected = selectedIds.includes(company.id);
                return (
                    <div
                        key={company.id}
                        className={`companies ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleClick(company.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <img
                            src={`${process.env.REACT_APP_BASE_URL}${company.logo_img}`}
                            alt={company.name}
                            className="img-fluid"
                        />
                    </div>
                );
            })}
        </div>
    );
};

export { TypeCompanies };
